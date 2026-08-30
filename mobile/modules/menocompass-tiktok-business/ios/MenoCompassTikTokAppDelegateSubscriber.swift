import ExpoModulesCore
import TikTokBusinessSDK
import UIKit

public final class MenoCompassTikTokAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  private enum InfoKey {
    static let appId = "MenoCompassTikTokAppID"
    static let businessAppId = "MenoCompassTikTokBusinessAppID"
    static let appSecret = "MenoCompassTikTokAppSecret"
  }

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
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
      #if DEBUG
      NSLog("TikTok Business SDK was not initialized because its build configuration is missing.")
      #endif
      return true
    }

    // AppsFlyer remains the only SKAdNetwork conversion-value writer.
    config.disableSKAdNetworkSupport()

    // Revenue events are forwarded through RevenueCat/AppsFlyer, so StoreKit
    // purchases must not also be auto-reported by TikTok.
    config.disablePaymentTracking()

    // Never inspect UIKit interaction data in this health-tracking app.
    config.disableAutoEnhancedDataPostbackEvent()

    // The React Native shell presents the app's single ATT prompt immediately
    // after startup. Hold the first flush long enough to include its result.
    config.setDelayForATTUserAuthorizationInSeconds(60)

    TikTokBusiness.initializeSdk(config) { success, error in
      #if DEBUG
      if !success {
        NSLog(
          "TikTok Business SDK initialization failed: %@",
          error?.localizedDescription ?? "Unknown error"
        )
      }
      #endif
    }

    return true
  }
}
