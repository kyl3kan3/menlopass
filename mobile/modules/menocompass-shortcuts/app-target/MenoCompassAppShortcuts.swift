import AppIntents
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
}

@available(iOS 16.0, *)
struct LogWithMenoCompassIntent: AppIntent {
  static var title: LocalizedStringResource = "Log with MenoCompass"
  static var description = IntentDescription(
    "Opens your private MenoCompass daily check-in. It never records anything until you confirm it in the app."
  )
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    MenoCompassShortcutRouteStore.publish(.checkin)
    return .result()
  }
}

@available(iOS 16.0, *)
struct ReviewMenoCompassPatternsIntent: AppIntent {
  static var title: LocalizedStringResource = "Review MenoCompass patterns"
  static var description = IntentDescription(
    "Opens your private MenoCompass pattern insights without exposing health details to Shortcuts or Siri."
  )
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    MenoCompassShortcutRouteStore.publish(.insights)
    return .result()
  }
}

@available(iOS 16.0, *)
struct MenoCompassAppShortcuts: AppShortcutsProvider {
  @AppShortcutsBuilder
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogWithMenoCompassIntent(),
      phrases: [
        "Log with \(.applicationName)",
        "Start my check-in in \(.applicationName)"
      ],
      shortTitle: "Log with MenoCompass",
      systemImageName: "checkmark.circle"
    )
    AppShortcut(
      intent: ReviewMenoCompassPatternsIntent(),
      phrases: [
        "Review \(.applicationName) patterns",
        "Show my patterns in \(.applicationName)"
      ],
      shortTitle: "Review patterns",
      systemImageName: "chart.xyaxis.line"
    )
  }

  static var shortcutTileColor: ShortcutTileColor = .teal
}
