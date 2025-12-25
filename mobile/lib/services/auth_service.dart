import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_response.dart';
import '../models/user.dart';
import 'api_service.dart';

/// Authentication service for login, logout, and token management
class AuthService {
  final ApiService _apiService;
  final FlutterSecureStorage _storage;

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';

  AuthService({
    required ApiService apiService,
    FlutterSecureStorage? storage,
  })  : _apiService = apiService,
        _storage = storage ?? const FlutterSecureStorage();

  /// Login with phone number and password
  Future<AuthResponse> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      final response = await _apiService.post(
        '/auth/login',
        data: {
          'phoneNumber': phoneNumber,
          'password': password,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Save tokens and user data
      await saveAuthData(authResponse);

      // Set auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);

      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  /// Register new user (Step 1: Phone number and name)
  Future<SmsVerificationResponse> register({
    required String fullName,
    required String phoneNumber,
  }) async {
    try {
      final response = await _apiService.post(
        '/auth/register',
        data: {
          'fullName': fullName,
          'phoneNumber': phoneNumber,
        },
      );

      return SmsVerificationResponse.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Verify SMS code
  Future<AuthResponse> verifySms({
    required String phoneNumber,
    required String code,
  }) async {
    try {
      final response = await _apiService.post(
        '/auth/verify-sms',
        data: {
          'phoneNumber': phoneNumber,
          'code': code,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Save tokens and user data
      await saveAuthData(authResponse);

      // Set auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);

      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  /// Refresh access token
  Future<AuthResponse> refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);

      if (refreshToken == null) {
        throw ApiException(message: 'No refresh token found');
      }

      final response = await _apiService.post(
        '/auth/refresh-token',
        data: {
          'refreshToken': refreshToken,
        },
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Save new tokens
      await saveAuthData(authResponse);

      // Update auth token in API service
      _apiService.setAuthToken(authResponse.accessToken);

      return authResponse;
    } catch (e) {
      // If refresh fails, clear all auth data
      await clearAuthData();
      rethrow;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      // Call logout endpoint if needed
      // await _apiService.post('/auth/logout');

      // Clear all auth data
      await clearAuthData();

      // Clear auth token from API service
      _apiService.clearAuthToken();
    } catch (e) {
      // Still clear local data even if API call fails
      await clearAuthData();
      _apiService.clearAuthToken();
    }
  }

  /// Save authentication data to secure storage
  Future<void> saveAuthData(AuthResponse authResponse) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: authResponse.accessToken),
      _storage.write(key: _refreshTokenKey, value: authResponse.refreshToken),
      _storage.write(
        key: _userDataKey,
        value: _userDataToJson(authResponse.user),
      ),
    ]);
  }

  /// Get stored access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  /// Get stored refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Get stored user data
  Future<User?> getUserData() async {
    final userData = await _storage.read(key: _userDataKey);
    if (userData == null) return null;

    try {
      // Parse stored user data
      final Map<String, dynamic> json = _parseUserData(userData);
      return User.fromJson(json);
    } catch (e) {
      print('Error parsing user data: $e');
      return null;
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// Clear all authentication data
  Future<void> clearAuthData() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userDataKey),
    ]);
  }

  /// Initialize auth state on app start
  Future<User?> initializeAuth() async {
    try {
      final token = await getAccessToken();
      if (token == null || token.isEmpty) {
        return null;
      }

      // Set token in API service
      _apiService.setAuthToken(token);

      // Get user data
      final user = await getUserData();
      return user;
    } catch (e) {
      print('Error initializing auth: $e');
      await clearAuthData();
      return null;
    }
  }

  // Helper methods for serialization
  String _userDataToJson(User user) {
    // Convert user to JSON string
    final json = user.toJson();
    return jsonEncode(json);
  }

  Map<String, dynamic> _parseUserData(String data) {
    // Parse JSON string back to map
    return jsonDecode(data) as Map<String, dynamic>;
  }
}
