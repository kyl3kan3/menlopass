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

    AsyncFunction("trackCommerceEventAsync") { (eventName: String, properties: [String: Any], promise: Promise) in
      // Project the untyped bridge payload before crossing the actor boundary.
      // String dictionaries are Sendable; JavaScript's [String: Any] is not.
      let stringProperties = properties.compactMapValues { $0 as? String }
      Task { @MainActor in
        guard case .initialized = Self.initializationState,
              ATTrackingManager.trackingAuthorizationStatus != .notDetermined else {
          promise.reject(TikTokTrackingPermissionUnresolvedException())
          return
        }
        let events: Set<String> = [
          "mc_app_launched", "mc_subscription_status_checked", "mc_subscription_check_failed",
          "mc_paywall_requested", "mc_paywall_rendered", "mc_paywall_failed", "mc_paywall_dismissed",
          "mc_purchase_started", "mc_purchase_cancelled", "mc_purchase_failed", "mc_purchase_completed",
          "mc_restore_started", "mc_restore_completed", "mc_restore_failed"
        ]
        guard events.contains(eventName) else { promise.resolve(); return }
        // Deliberately excludes revenue, identifiers, health content and free text.
        let enums: [String: Set<String>] = [
          "access": ["unknown", "active", "inactive"],
          "storeEnvironment": ["unknown", "sandbox", "production"],
          "periodType": ["unknown", "NORMAL", "INTRO", "TRIAL", "PREPAID"],
          "ownershipType": ["unknown", "PURCHASED", "FAMILY_SHARED", "UNKNOWN"],
          "source": ["automatic", "subscribe_button", "feature", "gate", "paywall"],
          "reason": ["no_offering", "free_offer", "offerings_error", "render_error", "sdk_error"],
          "buildChannel": ["development", "preview", "production", "unknown"]
        ]
        var safe: [String: Any] = ["schemaVersion": 2]
        for (key, values) in enums {
          if let value = stringProperties[key], values.contains(value) { safe[key] = value }
        }
        for key in ["offeringId", "productId", "packageType", "runtimeVersion", "updateId"] {
          if let value = stringProperties[key],
             value.range(of: "^[a-zA-Z0-9_.$:-]{1,100}$", options: .regularExpression) != nil { safe[key] = value }
        }
        if let code = stringProperties["errorCode"],
           code.range(of: "^[0-9]{1,3}$", options: .regularExpression) != nil { safe["errorCode"] = code }
        TikTokBusiness.trackTTEvent(TikTokBaseEvent(eventName: eventName, properties: safe, eventId: nil))
        promise.resolve()
      }
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
