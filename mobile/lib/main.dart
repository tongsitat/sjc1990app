import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/pending_approval_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/splash_screen.dart';

void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: ".env");

  runApp(
    const ProviderScope(
      child: SJC1990App(),
    ),
  );
}

class SJC1990App extends StatelessWidget {
  const SJC1990App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SJC1990 Classmates',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}

/// Authentication gate - shows login or home based on auth state
class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Show splash screen while initializing
    if (authState.isLoading) {
      return const SplashScreen();
    }

    // Show login if not authenticated
    if (!authState.isAuthenticated || authState.user == null) {
      return const LoginScreen();
    }

    // Show pending approval screen if user is pending
    if (authState.user?.isPending == true) {
      return const PendingApprovalScreen();
    }

    // Show home screen if authenticated and approved
    return const HomeScreen();
  }
}
