import AppTrackingTransparency
import ExpoModulesCore
import Foundation
import TikTokBusinessSDK

private final class TikTokTrackingPermissionUnresolvedException: Exception {
  override var reason: String {
    "TikTok Business cannot initialize before App Tracking Transparency has resolved."
  }
}

private final class TikTokConfigurationMissingException: Exception {
  override var reason: String {
    "TikTok Business build configuration is missing from Info.plist."
  }
}

private final class TikTokInitializationFailedException: GenericException<String> {
  override var reason: String {
    "TikTok Business SDK initialization failed: \(param)"
  }
}

public final class MenoCompassTikTokBusinessModule: Module {
  private enum InfoKey {
    static let appId = "MenoCompassTikTokAppID"
    static let businessAppId = "MenoCompassTikTokBusinessAppID"
    static let appSecret = "MenoCompassTikTokAppSecret"
  }

  private enum InitializationState {
    case notStarted
    case starting([Promise])
    case initialized
  }

  @MainActor
  private static var initializationState = InitializationState.notStarted

  public func definition() -> ModuleDefinition {
    Name("MenoCompassTikTokBusiness")

    AsyncFunction("initializeAsync") { (trackingPermission: String, promise: Promise) in
      Task { @MainActor in
        Self.initialize(trackingPermission: trackingPermission, promise: promise)
      }
      return
    }
  }

  @MainActor
  private static func initialize(trackingPermission: String, promise: Promise) {
    guard
      trackingPermission != "undetermined",
      ATTrackingManager.trackingAuthorizationStatus != .notDetermined
    else {
      promise.reject(TikTokTrackingPermissionUnresolvedException())
      return
    }

    switch initializationState {
    case .initialized:
      promise.resolve(true)
      return
    case .starting(var pendingPromises):
      pendingPromises.append(promise)
      initializationState = .starting(pendingPromises)
      return
    case .notStarted:
      break
    }

    let info = Bundle.main.infoDictionary
    guard
      let appId = info?[InfoKey.appId] as? String,
      let businessAppId = info?[InfoKey.businessAppId] as? String,
      let appSecret = info?[InfoKey.appSecret] as? String,
      !appId.isEmpty,
      !businessAppId.isEmpty,
      !appSecret.isEmpty,
      let config = TikTokConfig(
        accessToken: appSecret,
        appId: appId,
        tiktokAppId: businessAppId
      )
    else {
      promise.reject(TikTokConfigurationMissingException())
      return
    }

    // AppsFlyer remains the only SKAdNetwork conversion-value writer.
    config.disableSKAdNetworkSupport()

    // Revenue events are forwarded through RevenueCat/AppsFlyer, so StoreKit
    // purchases must not also be auto-reported by TikTok.
    config.disablePaymentTracking()

    // Never inspect UIKit interaction data in this health-tracking app.
    config.disableAutoEnhancedDataPostbackEvent()

    initializationState = .starting([promise])
    TikTokBusiness.initializeSdk(config) { success, error in
      let failureMessage = error?.localizedDescription ?? "Unknown error"
      Task { @MainActor in
        Self.completeInitialization(success: success, failureMessage: failureMessage)
      }
    }
  }

  @MainActor
  private static func completeInitialization(success: Bool, failureMessage: String) {
    guard case .starting(let pendingPromises) = initializationState else {
      return
    }

    if success {
      initializationState = .initialized
      pendingPromises.forEach { $0.resolve(true) }
      return
    }

    initializationState = .notStarted
    pendingPromises.forEach {
      $0.reject(TikTokInitializationFailedException(failureMessage))
    }
  }
}
