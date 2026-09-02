import CryptoKit
import ExpoModulesCore
import Foundation
import Security

private enum MenoCompassSecurityError: Error, LocalizedError {
  case invalidCiphertext
  case invalidPassword
  case keychain(OSStatus)
  case randomBytes(OSStatus)
  case weakPassword

  var errorDescription: String? {
    switch self {
    case .invalidCiphertext:
      return "The encrypted MenoCompass data is invalid or damaged."
    case .invalidPassword:
      return "That password could not unlock this MenoCompass backup."
    case .keychain(let status):
      return "MenoCompass could not access its device encryption key (\(status))."
    case .randomBytes(let status):
      return "MenoCompass could not create secure random data (\(status))."
    case .weakPassword:
      return "Use a backup password with at least 10 characters."
    }
  }
}

public class MenoCompassSecurityModule: Module {
  private static let statePrefix = "MCSTATE1."
  private static let backupPrefix = "MCBACKUP1"
  private static let backupIterations = 210_000
  private static let stateAAD = Data("MenoCompassStateV1".utf8)
  private static let backupAAD = Data("MenoCompassBackupV1".utf8)
  private static let keychainService = "com.kyl3kan3.menlopass.state-encryption"
  private static let keychainAccount = "state-key-v1"

  public func definition() -> ModuleDefinition {
    Name("MenoCompassSecurity")

    AsyncFunction("encryptForDeviceAsync") { (plaintext: String) throws -> String in
      let key = try Self.deviceKey()
      let sealed = try AES.GCM.seal(Data(plaintext.utf8), using: key, authenticating: Self.stateAAD)
      guard let combined = sealed.combined else {
        throw MenoCompassSecurityError.invalidCiphertext
      }
      return Self.statePrefix + combined.base64EncodedString()
    }

    AsyncFunction("decryptForDeviceAsync") { (payload: String) throws -> String in
      guard payload.hasPrefix(Self.statePrefix) else {
        throw MenoCompassSecurityError.invalidCiphertext
      }
      let encoded = String(payload.dropFirst(Self.statePrefix.count))
      guard
        let combined = Data(base64Encoded: encoded),
        let box = try? AES.GCM.SealedBox(combined: combined)
      else {
        throw MenoCompassSecurityError.invalidCiphertext
      }
      do {
        let cleartext = try AES.GCM.open(
          box,
          using: try Self.deviceKey(),
          authenticating: Self.stateAAD
        )
        guard let value = String(data: cleartext, encoding: .utf8) else {
          throw MenoCompassSecurityError.invalidCiphertext
        }
        return value
      } catch let error as MenoCompassSecurityError {
        throw error
      } catch {
        throw MenoCompassSecurityError.invalidCiphertext
      }
    }

    AsyncFunction("encryptBackupAsync") { (plaintext: String, password: String) throws -> String in
      guard password.count >= 10 else {
        throw MenoCompassSecurityError.weakPassword
      }
      let salt = try Self.randomData(count: 16)
      let key = Self.deriveBackupKey(
        password: password,
        salt: salt,
        iterations: Self.backupIterations
      )
      let sealed = try AES.GCM.seal(Data(plaintext.utf8), using: key, authenticating: Self.backupAAD)
      guard let combined = sealed.combined else {
        throw MenoCompassSecurityError.invalidCiphertext
      }
      return [
        Self.backupPrefix,
        String(Self.backupIterations),
        salt.base64EncodedString(),
        combined.base64EncodedString(),
      ].joined(separator: ".")
    }

    AsyncFunction("decryptBackupAsync") { (payload: String, password: String) throws -> String in
      let components = payload.trimmingCharacters(in: .whitespacesAndNewlines)
        .split(separator: ".", omittingEmptySubsequences: false)
      guard
        components.count == 4,
        components[0] == Substring(Self.backupPrefix),
        let iterations = Int(components[1]),
        iterations >= 100_000,
        iterations <= 1_000_000,
        let salt = Data(base64Encoded: String(components[2])),
        salt.count == 16,
        let combined = Data(base64Encoded: String(components[3])),
        let box = try? AES.GCM.SealedBox(combined: combined)
      else {
        throw MenoCompassSecurityError.invalidCiphertext
      }
      let key = Self.deriveBackupKey(password: password, salt: salt, iterations: iterations)
      do {
        let cleartext = try AES.GCM.open(box, using: key, authenticating: Self.backupAAD)
        guard let value = String(data: cleartext, encoding: .utf8) else {
          throw MenoCompassSecurityError.invalidCiphertext
        }
        return value
      } catch {
        throw MenoCompassSecurityError.invalidPassword
      }
    }
  }

  private static func deviceKey() throws -> SymmetricKey {
    let lookup: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keychainAccount,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]
    var result: CFTypeRef?
    let readStatus = SecItemCopyMatching(lookup as CFDictionary, &result)
    if readStatus == errSecSuccess, let data = result as? Data, data.count == 32 {
      return SymmetricKey(data: data)
    }
    guard readStatus == errSecItemNotFound else {
      throw MenoCompassSecurityError.keychain(readStatus)
    }

    let keyData = try randomData(count: 32)
    let insert: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keychainAccount,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      kSecValueData as String: keyData,
    ]
    let insertStatus = SecItemAdd(insert as CFDictionary, nil)
    if insertStatus == errSecDuplicateItem {
      return try deviceKey()
    }
    guard insertStatus == errSecSuccess else {
      throw MenoCompassSecurityError.keychain(insertStatus)
    }
    return SymmetricKey(data: keyData)
  }

  private static func randomData(count: Int) throws -> Data {
    var bytes = [UInt8](repeating: 0, count: count)
    let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    guard status == errSecSuccess else {
      throw MenoCompassSecurityError.randomBytes(status)
    }
    return Data(bytes)
  }

  // PBKDF2-HMAC-SHA256, RFC 8018. A 32-byte result needs one SHA-256 block.
  private static func deriveBackupKey(
    password: String,
    salt: Data,
    iterations: Int
  ) -> SymmetricKey {
    let passwordKey = SymmetricKey(data: Data(password.utf8))
    var firstInput = salt
    firstInput.append(contentsOf: [0, 0, 0, 1])
    var current = Data(HMAC<SHA256>.authenticationCode(for: firstInput, using: passwordKey))
    var derived = current

    if iterations > 1 {
      for _ in 2...iterations {
        current = Data(HMAC<SHA256>.authenticationCode(for: current, using: passwordKey))
        for index in derived.indices {
          derived[index] ^= current[index]
        }
      }
    }
    return SymmetricKey(data: derived)
  }
}
