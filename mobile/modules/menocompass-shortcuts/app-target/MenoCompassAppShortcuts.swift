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
  static var title: LocalizedStringResource = "Log with peri"
  static var description = IntentDescription(
    "Opens the log sheet on today’s page in peri. Nothing is filed until you tap it in the app."
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
  static var title: LocalizedStringResource = "Open the peri dossier"
  static var description = IntentDescription(
    "Opens the dossier of findings in peri. Health details stay inside the app."
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
        "Log a moment in \(.applicationName)",
        "Start my check-in in \(.applicationName)"
      ],
      shortTitle: "Log with peri",
      systemImageName: "plus"
    )
    AppShortcut(
      intent: ReviewMenoCompassPatternsIntent(),
      phrases: [
        "Open my \(.applicationName) dossier",
        "Review \(.applicationName) patterns",
        "Show my findings in \(.applicationName)"
      ],
      shortTitle: "Open the dossier",
      systemImageName: "book.closed"
    )
  }

  static var shortcutTileColor: ShortcutTileColor = .red
}
