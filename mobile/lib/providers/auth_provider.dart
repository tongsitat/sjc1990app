import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_response.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Authentication state
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }

  /// Clear error state
  AuthState clearError() {
    return copyWith(error: '');
  }

  @override
  String toString() {
    return 'AuthState(isAuthenticated: $isAuthenticated, user: ${user?.fullName}, isLoading: $isLoading, error: $error)';
  }
}

/// Authentication state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    // Initialize auth state on creation
    _initializeAuth();
  }

  /// Initialize authentication state from stored data
  Future<void> _initializeAuth() async {
    try {
      state = state.copyWith(isLoading: true);

      final user = await _authService.initializeAuth();

      if (user != null) {
        state = AuthState(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        print('✅ Auth initialized: ${user.fullName}');
      } else {
        state = AuthState(isLoading: false);
        print('ℹ️ No stored auth found');
      }
    } catch (e) {
      print('❌ Auth initialization error: $e');
      state = AuthState(
        isLoading: false,
        error: 'Failed to initialize authentication',
      );
    }
  }

  /// Login with phone number and password
  Future<void> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: '');

      final authResponse = await _authService.login(
        phoneNumber: phoneNumber,
        password: password,
      );

      state = AuthState(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
      );

      print('✅ Login successful: ${authResponse.user.fullName}');
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      print('❌ Login failed: ${e.message}');
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      print('❌ Login error: $e');
      rethrow;
    }
  }

  /// Register new user
  Future<SmsVerificationResponse> register({
    required String fullName,
    required String phoneNumber,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: '');

      final response = await _authService.register(
        fullName: fullName,
        phoneNumber: phoneNumber,
      );

      state = state.copyWith(isLoading: false);

      print('✅ Registration SMS sent: ${response.message}');
      return response;
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      print('❌ Registration failed: ${e.message}');
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      print('❌ Registration error: $e');
      rethrow;
    }
  }

  /// Verify SMS code
  Future<void> verifySms({
    required String phoneNumber,
    required String code,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: '');

      final authResponse = await _authService.verifySms(
        phoneNumber: phoneNumber,
        code: code,
      );

      state = AuthState(
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
      );

      print('✅ SMS verified: ${authResponse.user.fullName}');
    } on ApiException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message,
      );
      print('❌ SMS verification failed: ${e.message}');
      rethrow;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      print('❌ SMS verification error: $e');
      rethrow;
    }
  }

  /// Refresh authentication token
  Future<void> refreshToken() async {
    try {
      final authResponse = await _authService.refreshToken();

      state = state.copyWith(
        user: authResponse.user,
        isAuthenticated: true,
      );

      print('✅ Token refreshed');
    } catch (e) {
      print('❌ Token refresh failed: $e');
      // If refresh fails, logout
      await logout();
      rethrow;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _authService.logout();

      state = AuthState();

      print('✅ Logout successful');
    } catch (e) {
      print('❌ Logout error: $e');
      // Still clear state even if API call fails
      state = AuthState();
    }
  }

  /// Clear error state
  void clearError() {
    state = state.clearError();
  }
}

/// API Service provider
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

/// Auth Service provider
final authServiceProvider = Provider<AuthService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthService(apiService: apiService);
});

/// Auth State provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

/// Convenience provider to check if user is authenticated
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

/// Convenience provider to get current user
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
