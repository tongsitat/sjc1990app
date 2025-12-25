import 'user.dart';

/// Authentication response from login/register endpoints
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;
  final int expiresIn; // Token expiration time in seconds

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    required this.expiresIn,
  });

  /// Create AuthResponse from JSON
  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      expiresIn: json['expiresIn'] as int? ?? 3600, // Default 1 hour
    );
  }

  /// Convert AuthResponse to JSON
  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user.toJson(),
      'expiresIn': expiresIn,
    };
  }

  /// Calculate token expiration DateTime
  DateTime get expiresAt {
    return DateTime.now().add(Duration(seconds: expiresIn));
  }

  @override
  String toString() {
    return 'AuthResponse(user: ${user.fullName}, expiresIn: ${expiresIn}s)';
  }
}

/// SMS Verification response
class SmsVerificationResponse {
  final String message;
  final String? verificationId;

  SmsVerificationResponse({
    required this.message,
    this.verificationId,
  });

  factory SmsVerificationResponse.fromJson(Map<String, dynamic> json) {
    return SmsVerificationResponse(
      message: json['message'] as String,
      verificationId: json['verificationId'] as String?,
    );
  }
}
