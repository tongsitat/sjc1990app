/// User model representing a registered classmate
class User {
  final String userId;
  final String fullName;
  final String phoneNumber;
  final String? email;
  final String? profilePhotoUrl;
  final String? bio;
  final String status; // 'pending', 'approved', 'rejected'
  final DateTime createdAt;
  final DateTime? approvedAt;

  User({
    required this.userId,
    required this.fullName,
    required this.phoneNumber,
    this.email,
    this.profilePhotoUrl,
    this.bio,
    required this.status,
    required this.createdAt,
    this.approvedAt,
  });

  /// Create User from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'] as String,
      fullName: json['fullName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      email: json['email'] as String?,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
      bio: json['bio'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      approvedAt: json['approvedAt'] != null
          ? DateTime.parse(json['approvedAt'] as String)
          : null,
    );
  }

  /// Convert User to JSON
  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'profilePhotoUrl': profilePhotoUrl,
      'bio': bio,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'approvedAt': approvedAt?.toIso8601String(),
    };
  }

  /// Check if user is approved
  bool get isApproved => status == 'approved';

  /// Check if user is pending approval
  bool get isPending => status == 'pending';

  /// Check if user is rejected
  bool get isRejected => status == 'rejected';

  /// Copy with method for updating user properties
  User copyWith({
    String? userId,
    String? fullName,
    String? phoneNumber,
    String? email,
    String? profilePhotoUrl,
    String? bio,
    String? status,
    DateTime? createdAt,
    DateTime? approvedAt,
  }) {
    return User(
      userId: userId ?? this.userId,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      bio: bio ?? this.bio,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      approvedAt: approvedAt ?? this.approvedAt,
    );
  }

  @override
  String toString() {
    return 'User(userId: $userId, fullName: $fullName, status: $status)';
  }
}
