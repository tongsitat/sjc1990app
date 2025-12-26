import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';

/// Main feed tab - shows forum posts, announcements, updates
class FeedTab extends ConsumerStatefulWidget {
  const FeedTab({super.key});

  @override
  ConsumerState<FeedTab> createState() => _FeedTabState();
}

class _FeedTabState extends ConsumerState<FeedTab> {
  bool _isLoading = true;
  final List<FeedPost> _posts = [];

  @override
  void initState() {
    super.initState();
    _loadFeed();
  }

  Future<void> _loadFeed() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Load posts from backend API
      await Future.delayed(const Duration(seconds: 1));

      setState(() {
        // Mock data for now
        _posts.addAll([
          FeedPost(
            id: '1',
            authorName: 'Sarah Chen',
            authorAvatar: null,
            content:
                'Hey everyone! Can\'t believe it\'s been 34 years since graduation. Looking forward to reconnecting with all of you! 🎓',
            timestamp: DateTime.now().subtract(const Duration(hours: 2)),
            likeCount: 12,
            commentCount: 5,
            isLiked: false,
          ),
          FeedPost(
            id: '2',
            authorName: 'Admin',
            authorAvatar: null,
            content:
                '📢 Reunion Planning: We\'re planning our 35th reunion for next year! Please share your availability in the poll below.',
            timestamp: DateTime.now().subtract(const Duration(hours: 5)),
            likeCount: 28,
            commentCount: 15,
            isLiked: true,
            isPinned: true,
          ),
          FeedPost(
            id: '3',
            authorName: 'Michael Wong',
            authorAvatar: null,
            content:
                'Does anyone remember our science teacher Mr. Lee? I found some old class photos from 1988!',
            timestamp: DateTime.now().subtract(const Duration(days: 1)),
            likeCount: 8,
            commentCount: 12,
            isLiked: false,
          ),
        ]);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleRefresh() async {
    await _loadFeed();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SJC Class of 1990'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _handleRefresh,
              child: _posts.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _posts.length,
                      itemBuilder: (context, index) {
                        return _buildPostCard(_posts[index]);
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Navigate to create post screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Create post - Coming soon!'),
            ),
          );
        },
        icon: const Icon(Icons.edit),
        label: const Text('Post'),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.forum_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No posts yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to post!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostCard(FeedPost post) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header (Avatar + Name + Time + Pin)
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.blue.shade100,
                  child: Text(
                    post.authorName[0],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            post.authorName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          if (post.isPinned) ...[
                            const SizedBox(width: 8),
                            Icon(
                              Icons.push_pin,
                              size: 16,
                              color: Colors.orange.shade700,
                            ),
                          ],
                        ],
                      ),
                      Text(
                        _formatTimestamp(post.timestamp),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () {
                    // TODO: Show post options
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Content
            Text(
              post.content,
              style: const TextStyle(fontSize: 15, height: 1.4),
            ),
            const SizedBox(height: 16),

            // Actions (Like, Comment, Share)
            Row(
              children: [
                // Like button
                InkWell(
                  onTap: () {
                    // TODO: Toggle like
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          post.isLiked ? Icons.favorite : Icons.favorite_border,
                          size: 20,
                          color: post.isLiked ? Colors.red : Colors.grey,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${post.likeCount}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Comment button
                InkWell(
                  onTap: () {
                    // TODO: Navigate to comments
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 20,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${post.commentCount}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),

                // Share button
                IconButton(
                  icon: Icon(
                    Icons.share_outlined,
                    size: 20,
                    color: Colors.grey.shade600,
                  ),
                  onPressed: () {
                    // TODO: Share post
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }
}

/// Feed post model
class FeedPost {
  final String id;
  final String authorName;
  final String? authorAvatar;
  final String content;
  final DateTime timestamp;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isPinned;

  FeedPost({
    required this.id,
    required this.authorName,
    this.authorAvatar,
    required this.content,
    required this.timestamp,
    required this.likeCount,
    required this.commentCount,
    required this.isLiked,
    this.isPinned = false,
  });

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    return FeedPost(
      id: json['postId'] as String,
      authorName: json['authorName'] as String,
      authorAvatar: json['authorAvatar'] as String?,
      content: json['content'] as String,
      timestamp: DateTime.parse(json['createdAt'] as String),
      likeCount: json['likeCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      isLiked: json['isLiked'] as bool? ?? false,
      isPinned: json['isPinned'] as bool? ?? false,
    );
  }
}
