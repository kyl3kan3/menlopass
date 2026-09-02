import ExpoModulesCore
import Foundation

private enum MenoCompassShortcutRoute: String {
  case checkin = "menlopass://checkin"
  case insights = "menlopass://insights"
}

private extension Notification.Name {
  static let menoCompassShortcutInvoked = Notification.Name(
    "com.kyl3kan3.menlopass.shortcut-invoked"
  )
}

private enum MenoCompassShortcutRouteStore {
  private static let appGroupIdentifier = "group.com.kyl3kan3.menlopass"
  private static let pendingUrlKey = "MenoCompassPendingShortcutUrl"

  private static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupIdentifier) ?? .standard
  }

  static func publish(_ route: MenoCompassShortcutRoute) {
    defaults.set(route.rawValue, forKey: pendingUrlKey)
    NotificationCenter.default.post(
      name: .menoCompassShortcutInvoked,
      object: nil,
      userInfo: ["url": route.rawValue]
    )
  }

  static func consume() -> String? {
    guard
      let value = defaults.string(forKey: pendingUrlKey),
      MenoCompassShortcutRoute(rawValue: value) != nil
    else {
      defaults.removeObject(forKey: pendingUrlKey)
      return nil
    }
    defaults.removeObject(forKey: pendingUrlKey)
    return value
  }
}

public final class MenoCompassShortcutsModule: Module {
  private var shortcutObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("MenoCompassShortcuts")
    Events("onShortcutInvoked")

    OnCreate { [weak self] in
      self?.shortcutObserver = NotificationCenter.default.addObserver(
        forName: .menoCompassShortcutInvoked,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        guard let url = notification.userInfo?["url"] as? String else {
          return
        }
        self?.sendEvent("onShortcutInvoked", ["url": url])
      }
    }

    OnDestroy { [weak self] in
      guard let observer = self?.shortcutObserver else {
        return
      }
      NotificationCenter.default.removeObserver(observer)
      self?.shortcutObserver = nil
    }

    Function("consumePendingUrl") { () -> String? in
      MenoCompassShortcutRouteStore.consume()
    }
  }
}
