import ExpoModulesCore
import Foundation
import HealthKit

private final class HealthKitAuthorizationException: GenericException<String> {
  override var reason: String {
    "HealthKit authorization could not be completed: \(param)"
  }
}

private final class HealthKitUserActionRequiredException: Exception {
  override var reason: String {
    "HealthKit access must be started by an explicit user action."
  }
}

public final class MenoCompassHealthKitModule: Module {
  private let healthStore = HKHealthStore()
  private let isoFormatter = ISO8601DateFormatter()

  private static let stepType = HKObjectType.quantityType(forIdentifier: .stepCount)
  private static let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
  private static let bodyMassType = HKObjectType.quantityType(forIdentifier: .bodyMass)

  private static let readTypes: Set<HKObjectType> = {
    var types = Set<HKObjectType>()
    if let stepType { types.insert(stepType) }
    if let sleepType { types.insert(sleepType) }
    if let bodyMassType { types.insert(bodyMassType) }
    return types
  }()

  public func definition() -> ModuleDefinition {
    Name("MenoCompassHealthKit")

    Function("isAvailable") {
      HKHealthStore.isHealthDataAvailable()
    }

    AsyncFunction("getRequestStatusAsync") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(Self.requestStatusPayload(available: false, status: "unavailable"))
        return
      }

      self.healthStore.getRequestStatusForAuthorization(
        toShare: Set<HKSampleType>(),
        read: Self.readTypes
      ) { status, error in
        if let error {
          promise.reject(HealthKitAuthorizationException(error.localizedDescription))
          return
        }

        promise.resolve(
          Self.requestStatusPayload(available: true, status: Self.requestStatusName(status))
        )
      }
    }

    AsyncFunction("requestAuthorizationAsync") { (userInitiated: Bool, promise: Promise) in
      guard userInitiated else {
        promise.reject(HealthKitUserActionRequiredException())
        return
      }

      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve([
          "available": false,
          "promptCompleted": false,
          "requestStatus": "unavailable",
          "readOnly": true,
        ])
        return
      }

      self.healthStore.requestAuthorization(
        toShare: Set<HKSampleType>(),
        read: Self.readTypes
      ) { success, error in
        if let error {
          promise.reject(HealthKitAuthorizationException(error.localizedDescription))
          return
        }

        self.healthStore.getRequestStatusForAuthorization(
          toShare: Set<HKSampleType>(),
          read: Self.readTypes
        ) { status, statusError in
          if let statusError {
            promise.reject(HealthKitAuthorizationException(statusError.localizedDescription))
            return
          }

          // HealthKit intentionally does not disclose per-type read permission.
          // A successful prompt means the request completed, not that every read
          // type was granted. Queries below therefore treat missing data as private.
          promise.resolve([
            "available": true,
            "promptCompleted": success,
            "requestStatus": Self.requestStatusName(status),
            "readOnly": true,
          ])
        }
      }
    }.runOnQueue(.main)

    AsyncFunction("syncSummaryAsync") {
      (lookbackDays: Int, userInitiated: Bool, promise: Promise) in
      guard userInitiated else {
        promise.reject(HealthKitUserActionRequiredException())
        return
      }

      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(Self.unavailableSummary(lookbackDays: lookbackDays))
        return
      }

      let boundedLookbackDays = min(max(lookbackDays, 1), 30)
      self.loadSummary(lookbackDays: boundedLookbackDays) { summary in
        promise.resolve(summary)
      }
    }
  }

  private static func requestStatusPayload(available: Bool, status: String) -> [String: Any] {
    [
      "available": available,
      "requestStatus": status,
      "readOnly": true,
    ]
  }

  private static func requestStatusName(_ status: HKAuthorizationRequestStatus) -> String {
    switch status {
    case .shouldRequest:
      return "shouldRequest"
    case .unnecessary:
      return "unnecessary"
    case .unknown:
      return "unknown"
    @unknown default:
      return "unknown"
    }
  }

  private static func unavailableSummary(lookbackDays: Int) -> [String: Any] {
    [
      "available": false,
      "readOnly": true,
      "generatedAt": ISO8601DateFormatter().string(from: Date()),
      "lookbackDays": min(max(lookbackDays, 1), 30),
      "hasAnyData": false,
      "steps": ["total": NSNull(), "dailyAverage": NSNull()],
      "sleep": [
        "totalHours": NSNull(),
        "nightlyAverageHours": NSNull(),
        "trackedNights": 0,
      ],
      "bodyWeight": ["latestKilograms": NSNull(), "recordedAt": NSNull()],
      "warnings": ["healthKitUnavailable"],
    ]
  }

  private func loadSummary(
    lookbackDays: Int,
    completion: @escaping ([String: Any]) -> Void
  ) {
    let endDate = Date()
    let calendar = Calendar.current
    let startOfToday = calendar.startOfDay(for: endDate)
    let startDate = calendar.date(byAdding: .day, value: -(lookbackDays - 1), to: startOfToday)
      ?? endDate.addingTimeInterval(TimeInterval(-86_400 * lookbackDays))

    querySteps(from: startDate, to: endDate) { stepTotal, stepWarning in
      self.querySleep(from: startDate, to: endDate) { sleepAggregate, sleepWarning in
        self.queryLatestBodyWeight { weight, weightWarning in
          let warnings = [stepWarning, sleepWarning, weightWarning].compactMap { $0 }
          let stepTotalRounded = stepTotal.map { Int($0.rounded()) }
          let dailyAverage = stepTotal.map { Int(($0 / Double(lookbackDays)).rounded()) }
          let totalSleepHours = sleepAggregate?.totalHours
          let trackedNights = sleepAggregate?.trackedNights ?? 0
          let nightlyAverage = totalSleepHours.flatMap {
            trackedNights > 0 ? $0 / Double(trackedNights) : nil
          }
          let hasAnyData = stepTotal != nil || totalSleepHours != nil || weight != nil

          completion([
            "available": true,
            "readOnly": true,
            "generatedAt": self.isoFormatter.string(from: endDate),
            "lookbackDays": lookbackDays,
            "hasAnyData": hasAnyData,
            "steps": [
              "total": Self.jsValue(stepTotalRounded),
              "dailyAverage": Self.jsValue(dailyAverage),
            ],
            "sleep": [
              "totalHours": Self.jsValue(totalSleepHours),
              "nightlyAverageHours": Self.jsValue(nightlyAverage),
              "trackedNights": trackedNights,
            ],
            "bodyWeight": [
              "latestKilograms": Self.jsValue(weight?.kilograms),
              "recordedAt": Self.jsValue(weight.map { self.isoFormatter.string(from: $0.date) }),
            ],
            "warnings": warnings,
          ])
        }
      }
    }
  }

  private func querySteps(
    from startDate: Date,
    to endDate: Date,
    completion: @escaping (Double?, String?) -> Void
  ) {
    guard let stepType = Self.stepType else {
      completion(nil, "stepsUnavailable")
      return
    }

    let predicate = HKQuery.predicateForSamples(
      withStart: startDate,
      end: endDate,
      options: [.strictStartDate, .strictEndDate]
    )
    let query = HKStatisticsQuery(
      quantityType: stepType,
      quantitySamplePredicate: predicate,
      options: .cumulativeSum
    ) { _, result, error in
      guard error == nil else {
        completion(nil, "stepsQueryFailed")
        return
      }
      let total = result?.sumQuantity()?.doubleValue(for: .count())
      completion(total, nil)
    }
    healthStore.execute(query)
  }

  private struct SleepAggregate {
    let totalHours: Double
    let trackedNights: Int
  }

  private func querySleep(
    from startDate: Date,
    to endDate: Date,
    completion: @escaping (SleepAggregate?, String?) -> Void
  ) {
    guard let sleepType = Self.sleepType else {
      completion(nil, "sleepUnavailable")
      return
    }

    let predicate = HKQuery.predicateForSamples(
      withStart: startDate,
      end: endDate,
      options: .strictEndDate
    )
    let query = HKSampleQuery(
      sampleType: sleepType,
      predicate: predicate,
      limit: HKObjectQueryNoLimit,
      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
    ) { _, samples, error in
      guard error == nil else {
        completion(nil, "sleepQueryFailed")
        return
      }

      let asleepValues: Set<Int> = [
        HKCategoryValueSleepAnalysis.asleepCore.rawValue,
        HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
        HKCategoryValueSleepAnalysis.asleepREM.rawValue,
        HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
      ]
      let intervals = (samples as? [HKCategorySample] ?? [])
        .filter { asleepValues.contains($0.value) }
        .map { DateInterval(start: max($0.startDate, startDate), end: min($0.endDate, endDate)) }
        .filter { $0.duration > 0 }
        .sorted { $0.start < $1.start }

      guard !intervals.isEmpty else {
        completion(nil, nil)
        return
      }

      var merged: [DateInterval] = []
      for interval in intervals {
        guard let last = merged.last, interval.start <= last.end else {
          merged.append(interval)
          continue
        }
        merged[merged.count - 1] = DateInterval(start: last.start, end: max(last.end, interval.end))
      }

      let totalHours = merged.reduce(0.0) { $0 + $1.duration } / 3_600.0
      // Assign sleep before noon to the preceding evening. This keeps one
      // overnight session from becoming two "tracked nights" at midnight.
      let nightCalendar = Calendar.current
      let nights = Set(merged.map { interval in
        let shiftedStart = nightCalendar.date(byAdding: .hour, value: -12, to: interval.start)
          ?? interval.start
        return nightCalendar.startOfDay(for: shiftedStart)
      }).count
      completion(SleepAggregate(totalHours: totalHours, trackedNights: nights), nil)
    }
    healthStore.execute(query)
  }

  private struct BodyWeightReading {
    let kilograms: Double
    let date: Date
  }

  private func queryLatestBodyWeight(
    completion: @escaping (BodyWeightReading?, String?) -> Void
  ) {
    guard let bodyMassType = Self.bodyMassType else {
      completion(nil, "bodyWeightUnavailable")
      return
    }

    let query = HKSampleQuery(
      sampleType: bodyMassType,
      predicate: nil,
      limit: 1,
      sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
    ) { _, samples, error in
      guard error == nil else {
        completion(nil, "bodyWeightQueryFailed")
        return
      }
      guard let sample = samples?.first as? HKQuantitySample else {
        completion(nil, nil)
        return
      }
      completion(
        BodyWeightReading(
          kilograms: sample.quantity.doubleValue(for: .gramUnit(with: .kilo)),
          date: sample.endDate
        ),
        nil
      )
    }
    healthStore.execute(query)
  }

  private static func jsValue<T>(_ value: T?) -> Any {
    guard let value else { return NSNull() }
    return value
  }
}
