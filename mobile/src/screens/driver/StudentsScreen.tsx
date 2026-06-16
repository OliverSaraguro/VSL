import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { StudentCard } from '@/components/students/StudentCard';
import { Button } from '@/components/common/Button';
import studentsService from '@/servicios/students.service';
import type { Student } from '@/types';

interface StudentsScreenProps {
  navigation: any;
}

export const StudentsScreen: React.FC<StudentsScreenProps> = ({ navigation }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentsService.getAll();
      setStudents(data);
      setFiltered(data);
    } catch (err: any) {
      console.error('[StudentsScreen] loadStudents', err);
      Alert.alert('Error', err?.message || 'No se pudo cargar la lista de estudiantes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [loadStudents])
  );

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(students);
    } else {
      const query = search.toLowerCase();
      setFiltered(students.filter((s) => s.name.toLowerCase().includes(query)));
    }
  }, [search, students]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Header
        title="Estudiantes"
        onBack={() => navigation.goBack()}
        rightAction={
          <Button
            title="+"
            onPress={() => navigation.navigate('RegisterStudent')}
            size="sm"
            style={styles.addButton}
          />
        }
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar estudiante..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👩‍🎓"
          title="Sin estudiantes"
          message={search ? 'No se encontraron resultados' : 'Aún no has registrado estudiantes'}
          actionLabel="Registrar estudiante"
          onAction={() => navigation.navigate('RegisterStudent')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StudentCard student={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body.fontSize,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
