import { useState, useEffect } from 'react';
import recommendationsMapping from '../constants/recommendationsMapping';
import { getPageContent, savePageContent } from '../api/contentApi';
import { toast } from 'react-toastify';

const PAGE_KEY = 'recommendations-mapping-data';

export const buildDefaultMapping = () =>
  Object.entries(recommendationsMapping).map(([sectionTitle, obsGroups]) => ({
    title: sectionTitle,
    groups: Object.entries(obsGroups).map(([obs, recs]) => ({
      observation: obs,
      recommendations: recs.map(r => ({ text: r }))
    }))
  }));

export const useEditableMapping = () => {
  const [mapping, setMapping] = useState(buildDefaultMapping);

  useEffect(() => {
    getPageContent(PAGE_KEY)
      .then(data => {
        if (data?.htmlContent) {
          try { setMapping(JSON.parse(data.htmlContent)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const persist = async (updated) => {
    try {
      await savePageContent(PAGE_KEY, JSON.stringify(updated));
      toast.success('Saved');
    } catch { toast.error('Failed to save'); }
  };

  const saveSectionTitle = (sIdx, newTitle) => {
    const updated = mapping.map((s, i) => i === sIdx ? { ...s, title: newTitle } : s);
    setMapping(updated);
    persist(updated);
  };

  const saveRecommendation = (sIdx, gIdx, rIdx, newText) => {
    const updated = mapping.map((s, i) => {
      if (i !== sIdx) return s;
      return {
        ...s,
        groups: s.groups.map((g, j) => {
          if (j !== gIdx) return g;
          return {
            ...g,
            recommendations: g.recommendations.map((r, k) => k === rIdx ? { ...r, text: newText } : r)
          };
        })
      };
    });
    setMapping(updated);
    persist(updated);
  };

  return { mapping, saveSectionTitle, saveRecommendation };
};
