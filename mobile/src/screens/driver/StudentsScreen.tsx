import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/config/theme';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { StudentCard } from '@/components/students/StudentCard';
import studentsService from '@/servicios/students.service';
import type { Student } from '@/types';

interface StudentsScreenProps {
  navigation: any;
}

function AnimatedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      delay: Math.min(index * 45, 300),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export const StudentsScreen: React.FC<StudentsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isSmall = height < 700;

  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fabScale = useRef(new Animated.Value(1)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentsService.getAll();
      setStudents(data);
      setFiltered(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo cargar la lista de estudiantes.');
    } finally {
      setLoading(false);
      Animated.timing(contentAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [contentAnim]);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents])
  );

  useEffect(() => {
    const query = search.toLowerCase().trim();
    setFiltered(
      query ? students.filter((s) => s.name.toLowerCase().includes(query)) : students
    );
  }, [search, students]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const pressFab = (toValue: number) =>
    Animated.spring(fabScale, { toValue, useNativeDriver: true, tension: 220 }).start();

  if (loading) return <LoadingScreen />;

  const headerPaddingTop = insets.top + (Platform.OS === 'android' ? 4 : 0);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back-ios" size={19} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isSmall && { fontSize: 15 }]}>
            Estudiantes
          </Text>
          {students.length > 0 && (
            <Text style={styles.headerSub}>
              {students.length} {students.length === 1 ? 'registrado' : 'registrados'}
            </Text>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('RegisterStudent')}
            onPressIn={() => pressFab(0.9)}
            onPressOut={() => pressFab(1)}
            activeOpacity={1}
          >
            <MaterialIcons name="add" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Search bar */}
      <Animated.View
        style={[
          styles.searchWrapper,
          isSmall && styles.searchWrapperSmall,
          { opacity: contentAnim },
        ]}
      >
        <MaterialIcons name="search" size={17} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isSmall && { fontSize: 13 }]}
          placeholder="Buscar estudiante..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        />
        {search.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {search.length > 0 && (
        <Text style={styles.resultsHint}>
          {filtered.length === 0
            ? 'Sin resultados'
            : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
        </Text>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="school"
          title={search ? 'Sin resultados' : 'Sin estudiantes'}
          message={
            search
              ? `No se encontró "${search}"`
              : 'Aún no has registrado estudiantes'
          }
          actionLabel={search ? undefined : 'Registrar estudiante'}
          onAction={search ? undefined : () => navigation.navigate('RegisterStudent')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <StudentCard student={item} />
            </AnimatedListItem>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 16 },
            isSmall && styles.listSmall,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.secondary]}
              tintColor={colors.secondary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchWrapperSmall: {
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  resultsHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  listSmall: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
});
