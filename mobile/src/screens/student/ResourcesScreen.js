import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Image,
  FlatList,
  Linking
} from 'react-native';
import { Card, Button, Chip, Searchbar, TabView, SceneMap } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const VideoCard = ({ video, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.videoCard}>
    <Card>
      <Image source={{ uri: video.thumbnail }} style={styles.videoThumbnail} />
      <Card.Content style={styles.videoContent}>
        <View style={styles.videoHeader}>
          <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
          <Chip mode="outlined" compact>{video.duration}</Chip>
        </View>
        <Text style={styles.videoDescription} numberOfLines={2}>
          {video.description}
        </Text>
        <View style={styles.videoFooter}>
          <Chip mode="outlined" compact>{video.category}</Chip>
          <Chip mode="outlined" compact>{video.language}</Chip>
        </View>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

const ArticleCard = ({ article }) => (
  <Card style={styles.articleCard}>
    <Card.Content>
      <View style={styles.articleHeader}>
        <MaterialCommunityIcons name={article.icon} size={24} color="#1976d2" />
        <View style={styles.articleMeta}>
          <Chip mode="outlined" compact>{article.readTime}</Chip>
          <Chip mode="outlined" compact>{article.category}</Chip>
        </View>
      </View>
      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleContent} numberOfLines={4}>
        {article.content}
      </Text>
    </Card.Content>
  </Card>
);

const GameCard = ({ game, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.gameCard}>
    <Card>
      <Card.Content style={styles.gameContent}>
        <View style={[styles.gameIcon, { backgroundColor: game.color }]}>
          <MaterialCommunityIcons name={game.icon} size={32} color="#fff" />
        </View>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameDescription} numberOfLines={2}>
            {game.description}
          </Text>
        </View>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

const ImageCard = ({ image }) => (
  <Card style={styles.imageCard}>
    <Image source={{ uri: image.url }} style={styles.peacefulImage} />
    <Card.Content>
      <Text style={styles.imageTitle}>{image.title}</Text>
      <Text style={styles.imageDescription}>{image.description}</Text>
    </Card.Content>
  </Card>
);

const VideoModal = ({ visible, video, onClose }) => {
  const openVideo = () => {
    if (video?.embedUrl) {
      const youtubeUrl = video.embedUrl.replace('embed/', 'watch?v=');
      Linking.openURL(youtubeUrl);
    }
  };

  if (!video) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{video.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Image source={{ uri: video.thumbnail }} style={styles.modalImage} />
          <Text style={styles.modalDescription}>{video.description}</Text>
          
          <View style={styles.videoDetails}>
            <Chip mode="outlined">{video.duration}</Chip>
            <Chip mode="outlined">{video.category}</Chip>
            <Chip mode="outlined">{video.language}</Chip>
          </View>
          
          <Button
            mode="contained"
            onPress={openVideo}
            style={styles.watchButton}
            icon="play"
          >
            Watch on YouTube
          </Button>
        </ScrollView>
      </View>
    </Modal>
  );
};

const GameModal = ({ visible, game, onClose }) => {
  if (!game) return null;

  const renderGameContent = () => {
    switch (game.id) {
      case 'breathing':
        return (
          <View style={styles.gameModalContent}>
            <Text style={styles.gameInstructions}>
              Follow the breathing circle:
              {'\n'}• Breathe in as the circle expands
              {'\n'}• Hold your breath at the peak
              {'\n'}• Breathe out as the circle contracts
              {'\n'}• Repeat for 5 minutes
            </Text>
            <View style={styles.breathingCircle}>
              <Text style={styles.breathingText}>Breathe</Text>
            </View>
          </View>
        );
      
      case 'gratitude':
        return (
          <View style={styles.gameModalContent}>
            <Text style={styles.gameInstructions}>
              Write down three things you're grateful for today:
            </Text>
            <View style={styles.gratitudeInputs}>
              <Text style={styles.gratitudePrompt}>1. I am grateful for:</Text>
              <View style={styles.gratitudeBox}></View>
              <Text style={styles.gratitudePrompt}>2. I am grateful for:</Text>
              <View style={styles.gratitudeBox}></View>
              <Text style={styles.gratitudePrompt}>3. I am grateful for:</Text>
              <View style={styles.gratitudeBox}></View>
            </View>
          </View>
        );
      
      case 'mindfulness':
        return (
          <View style={styles.gameModalContent}>
            <Text style={styles.gameTitle}>5-4-3-2-1 Grounding Exercise</Text>
            <View style={styles.groundingSteps}>
              <View style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>👀 5</Text>
                <Text style={styles.groundingText}>Name 5 things you can SEE</Text>
              </View>
              <View style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>✋ 4</Text>
                <Text style={styles.groundingText}>Name 4 things you can TOUCH</Text>
              </View>
              <View style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>👂 3</Text>
                <Text style={styles.groundingText}>Name 3 things you can HEAR</Text>
              </View>
              <View style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>👃 2</Text>
                <Text style={styles.groundingText}>Name 2 things you can SMELL</Text>
              </View>
              <View style={styles.groundingStep}>
                <Text style={styles.groundingNumber}>👅 1</Text>
                <Text style={styles.groundingText}>Name 1 thing you can TASTE</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return (
          <View style={styles.gameModalContent}>
            <Text style={styles.gameInstructions}>
              This mindfulness exercise helps you stay present and calm.
              Follow the instructions and take your time.
            </Text>
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{game.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {renderGameContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function EnhancedResourcesScreen() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data from web version
  const videos = [
    {
      id: 1,
      title: "5-Minute Mindfulness Meditation",
      description: "Quick daily meditation for stress relief and mental clarity",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
      duration: "5:20",
      category: "Meditation",
      language: "English",
      embedUrl: "https://www.youtube.com/embed/ZToicYcHIOU"
    },
    {
      id: 2,
      title: "Breathing Techniques for Anxiety",
      description: "Learn 4-7-8 breathing and box breathing for instant calm",
      thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop",
      duration: "8:15",
      category: "Breathing",
      language: "English",
      embedUrl: "https://www.youtube.com/embed/tybOi4hjZFQ"
    },
    {
      id: 3,
      title: "योग निद्रा - गहरी विश्राम (Yoga Nidra)",
      description: "Deep relaxation technique in Hindi for better sleep",
      thumbnail: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300&h=200&fit=crop",
      duration: "15:45",
      category: "Sleep",
      language: "Hindi",
      embedUrl: "https://www.youtube.com/embed/M0u9GST_j3s"
    }
  ];

  const articles = [
    {
      title: "Understanding Mental Health",
      content: "Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act as we cope with life.",
      icon: "brain",
      readTime: "5 min read",
      category: "Education"
    },
    {
      title: "The Power of Gratitude",
      content: "Regular gratitude practice rewires your brain for positivity. Spend 5 minutes daily writing down three things you're grateful for.",
      icon: "heart",
      readTime: "3 min read",
      category: "Positivity"
    }
  ];

  const games = [
    {
      id: 'breathing',
      title: "Guided Breathing Circle",
      description: "Follow the animated circle to regulate your breathing",
      icon: 'lungs',
      color: "#4CAF50"
    },
    {
      id: 'gratitude',
      title: "Gratitude Journal",
      description: "Write down things you're grateful for today",
      icon: 'heart',
      color: "#E91E63"
    },
    {
      id: 'mindfulness',
      title: "5-4-3-2-1 Grounding",
      description: "Use your senses to stay present and calm",
      icon: 'nature',
      color: "#009688"
    }
  ];

  const images = [
    {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      title: "Mountain Lake Serenity",
      description: "Calm mountain lake reflecting cloudy skies"
    },
    {
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      title: "Forest Path",
      description: "Peaceful forest trail surrounded by green trees"
    }
  ];

  const VideosRoute = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => setSelectedVideo(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const ArticlesRoute = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={articles}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <ArticleCard article={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const GamesRoute = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            onPress={() => setSelectedGame(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const ImagesRoute = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <ImageCard image={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const routes = [
    { key: 'videos', title: t('videos') },
    { key: 'articles', title: t('articles') },
    { key: 'games', title: t('games') },
    { key: 'images', title: t('images') },
  ];

  const renderScene = SceneMap({
    videos: VideosRoute,
    articles: ArticlesRoute,
    games: GamesRoute,
    images: ImagesRoute,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('resources')}</Text>
        <Searchbar
          placeholder="Search resources..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width }}
      />

      <VideoModal
        visible={!!selectedVideo}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <GameModal
        visible={!!selectedGame}
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 15,
  },
  searchBar: {
    elevation: 2,
  },
  tabContent: {
    flex: 1,
    padding: 10,
  },
  videoCard: {
    marginVertical: 8,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
  },
  videoContent: {
    padding: 15,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  articleCard: {
    marginVertical: 8,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  articleMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  gameCard: {
    marginVertical: 8,
  },
  gameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
  },
  imageCard: {
    marginVertical: 8,
  },
  peacefulImage: {
    width: '100%',
    height: 200,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  imageDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  videoDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  watchButton: {
    marginTop: 10,
  },
  gameModalContent: {
    padding: 20,
  },
  gameInstructions: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 30,
  },
  breathingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gratitudeInputs: {
    marginTop: 20,
  },
  gratitudePrompt: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  gratitudeBox: {
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  groundingSteps: {
    marginTop: 20,
  },
  groundingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  groundingNumber: {
    fontSize: 24,
    marginRight: 15,
    minWidth: 50,
  },
  groundingText: {
    flex: 1,
    fontSize: 16,
  },
});