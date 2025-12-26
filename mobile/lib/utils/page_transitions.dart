import 'package:flutter/material.dart';

/// Custom page route with slide transition
class SlidePageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;
  final AxisDirection direction;

  SlidePageRoute({
    required this.page,
    this.direction = AxisDirection.left,
  }) : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            Offset begin;
            switch (direction) {
              case AxisDirection.up:
                begin = const Offset(0.0, 1.0);
                break;
              case AxisDirection.down:
                begin = const Offset(0.0, -1.0);
                break;
              case AxisDirection.left:
                begin = const Offset(1.0, 0.0);
                break;
              case AxisDirection.right:
                begin = const Offset(-1.0, 0.0);
                break;
            }

            const end = Offset.zero;
            const curve = Curves.easeInOut;

            var tween =
                Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
            var offsetAnimation = animation.drive(tween);

            return SlideTransition(
              position: offsetAnimation,
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        );
}

/// Custom page route with fade transition
class FadePageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  FadePageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        );
}

/// Custom page route with scale transition
class ScalePageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  ScalePageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const curve = Curves.easeInOut;
            var curvedAnimation =
                CurvedAnimation(parent: animation, curve: curve);

            return ScaleTransition(
              scale: curvedAnimation,
              child: FadeTransition(
                opacity: animation,
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        );
}

/// Helper class for navigation with custom transitions
class AppNavigator {
  /// Navigate with slide transition
  static Future<T?> slideToPage<T>(
    BuildContext context,
    Widget page, {
    AxisDirection direction = AxisDirection.left,
  }) {
    return Navigator.push<T>(
      context,
      SlidePageRoute<T>(page: page, direction: direction),
    );
  }

  /// Navigate with fade transition
  static Future<T?> fadeToPage<T>(BuildContext context, Widget page) {
    return Navigator.push<T>(
      context,
      FadePageRoute<T>(page: page),
    );
  }

  /// Navigate with scale transition
  static Future<T?> scaleToPage<T>(BuildContext context, Widget page) {
    return Navigator.push<T>(
      context,
      ScalePageRoute<T>(page: page),
    );
  }

  /// Replace current page with slide transition
  static Future<T?> slideReplacementToPage<T>(
    BuildContext context,
    Widget page, {
    AxisDirection direction = AxisDirection.left,
  }) {
    return Navigator.pushReplacement<T, void>(
      context,
      SlidePageRoute<T>(page: page, direction: direction),
    );
  }
}
