import { useState, useEffect } from 'react';
import { EVALUATION_SECTIONS } from '../constants/evaluationSections';
import { getPageContent, savePageContent } from '../api/contentApi';
import { toast } from 'react-toastify';

const PAGE_KEY = 'evaluate-sections-data';

export const buildDefaultSections = () => {
  const sections = EVALUATION_SECTIONS.map(s => ({ ...s, options: s.options.map(o => ({ ...o })) }));
  sections.push({
    title: '9. Additional Feedback',
    options: [
      { description: "Did the class session meet the instructor's goal or objective?" },
      { description: "Other Comments or Recommendations" }
    ]
  });
  return sections;
};

export const useEditableSections = () => {
  const [sections, setSections] = useState(buildDefaultSections);

  useEffect(() => {
    getPageContent(PAGE_KEY)
      .then(data => {
        if (data?.htmlContent) {
          try { setSections(JSON.parse(data.htmlContent)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Saves the given sections immediately — avoids stale closure issue
  const persist = async (newSections) => {
    try {
      await savePageContent(PAGE_KEY, JSON.stringify(newSections));
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const saveSectionTitle = (sIdx, newTitle) => {
    const updated = sections.map((s, i) =>
      i === sIdx ? { ...s, title: newTitle } : s
    );
    setSections(updated);
    persist(updated);
  };

  const saveOptionDescription = (sIdx, oIdx, newDesc) => {
    const updated = sections.map((s, i) => {
      if (i !== sIdx) return s;
      return { ...s, options: s.options.map((o, j) => j === oIdx ? { ...o, description: newDesc } : o) };
    });
    setSections(updated);
    persist(updated);
  };

  return { sections, saveSectionTitle, saveOptionDescription };
};
