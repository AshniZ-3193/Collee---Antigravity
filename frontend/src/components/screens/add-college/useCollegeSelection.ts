import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

import type {
  CollegeData,
  GlobalSchoolMatch,
  SelectedCollegeConfig,
} from './types';
import { toCustomCollegeId, toGlobalCollegeId } from './utils';

export const useCollegeSelection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(new Set());
  const [customColleges, setCustomColleges] = useState<Record<string, CollegeData>>({});
  const [globalColleges, setGlobalColleges] = useState<Record<string, CollegeData>>({});

  const trimmedSearchQuery = searchQuery.trim();
  const popularCollegesResult = useQuery(
    api.globalSchools.listPopularColleges,
    {},
  ) as CollegeData[] | undefined;
  const popularColleges = useMemo(() => popularCollegesResult ?? [], [popularCollegesResult]);
  const globalSchoolMatches = useQuery(api.globalSchools.searchByName, {
    query: trimmedSearchQuery,
    limit: 20,
  }) as GlobalSchoolMatch[] | undefined;

  useEffect(() => {
    if (!globalSchoolMatches) return;
    setGlobalColleges((prev) => {
      const next = { ...prev };
      for (const school of globalSchoolMatches) {
        const id = toGlobalCollegeId(school.slug);
        next[id] = {
          id,
          name: school.canonicalName,
          location: 'Global school',
          applicationTypes: [],
          schoolSlug: school.slug,
          qualityStatus: school.qualityStatus,
          qualityScore: school.qualityScore,
        };
      }
      return next;
    });
  }, [globalSchoolMatches]);

  const filteredColleges = useMemo(() => {
    const query = trimmedSearchQuery.toLowerCase();
    const popularMatches = popularColleges.filter(
      (college) => !query || college.name.toLowerCase().includes(query),
    );
    const globalMatches = Object.values(globalColleges).filter(
      (college) => !query || college.name.toLowerCase().includes(query),
    );

    const merged = [...popularMatches];
    for (const college of globalMatches) {
      if (!merged.some((item) => item.name.toLowerCase() === college.name.toLowerCase())) {
        merged.push(college);
      }
    }
    return merged;
  }, [globalColleges, trimmedSearchQuery, popularColleges]);

  const showAddCustom =
    trimmedSearchQuery.length > 0 &&
    !filteredColleges.some((college) => college.name.toLowerCase() === trimmedSearchQuery.toLowerCase());
  const customCollegeId = showAddCustom ? toCustomCollegeId(trimmedSearchQuery) : null;
  const customIsSelected = customCollegeId ? selectedColleges.has(customCollegeId) : false;

  const getCollegeById = (collegeId: string) => {
    return (
      customColleges[collegeId] ||
      globalColleges[collegeId] ||
      popularColleges.find((c) => c.id === collegeId) ||
      null
    );
  };

  const toggleCollegeSelection = (collegeId: string) => {
    setSelectedColleges((prev) => {
      const next = new Set(prev);
      if (next.has(collegeId)) {
        next.delete(collegeId);
      } else {
        next.add(collegeId);
      }
      return next;
    });
  };

  const handleAddCustomCollege = () => {
    const name = trimmedSearchQuery;
    if (!name) return;

    const id = toCustomCollegeId(name);

    setCustomColleges((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          id,
          name,
          location: 'Custom college',
          applicationTypes: [],
        },
      };
    });

    setSelectedColleges((prev) => new Set(prev).add(id));
    setSearchQuery('');
  };

  const removeSelectedCollege = (collegeId: string) => {
    setSelectedColleges((prev) => {
      const next = new Set(prev);
      next.delete(collegeId);
      return next;
    });

    if (collegeId.startsWith('custom:')) {
      setCustomColleges((prev) => {
        if (!prev[collegeId]) return prev;
        const next = { ...prev };
        delete next[collegeId];
        return next;
      });
    }
  };

  const selectedCollegesCount = selectedColleges.size;

  const getSelectedCollegeConfigs = (): SelectedCollegeConfig[] => {
    const configs: SelectedCollegeConfig[] = [];
    selectedColleges.forEach((collegeId) => {
      const college = getCollegeById(collegeId);
      if (!college) return;
      configs.push({
        collegeId: college.id,
        collegeName: college.name,
        applicationType: '',
        deadline: '',
        schoolSlug: college.schoolSlug,
        sourceQualityStatus: college.qualityStatus,
        sourceQualityScore: college.qualityScore,
      });
    });
    return configs;
  };

  return {
    searchQuery,
    setSearchQuery,
    trimmedSearchQuery,
    selectedColleges,
    selectedCollegesCount,
    filteredColleges,
    showAddCustom,
    customCollegeId,
    customIsSelected,
    globalColleges,
    setGlobalColleges,
    getCollegeById,
    toggleCollegeSelection,
    handleAddCustomCollege,
    removeSelectedCollege,
    getSelectedCollegeConfigs,
  };
};
