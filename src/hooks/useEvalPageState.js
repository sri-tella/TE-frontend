import { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { storageKeys } from '../utils/storageKeys';

export const useEvalPageState = ({ evaluationId, responses, storagePrefix }) => {
  const openKey = storagePrefix === 'eval'
    ? storageKeys.evalOpenSections(evaluationId)
    : storageKeys.recsOpenSections(evaluationId);
  const scrollKey = storagePrefix === 'eval'
    ? storageKeys.evalScroll(evaluationId)
    : storageKeys.recsScroll(evaluationId);

  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem(openKey);
    return saved ? JSON.parse(saved) : ['0'];
  });

  useEffect(() => {
    if (evaluationId) sessionStorage.setItem(openKey, JSON.stringify(openSections));
  }, [openSections, evaluationId, openKey]);

  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem(scrollKey);
    if (savedScroll) requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll)));
    const handleScroll = () => sessionStorage.setItem(scrollKey, window.scrollY.toString());
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [evaluationId, scrollKey]);

  const toggleSection = (idx) => {
    setOpenSections(prev =>
      prev.includes(String(idx))
        ? prev.filter(k => k !== String(idx))
        : [...prev, String(idx)]
    );
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const lowerQuery = searchQuery.toLowerCase();
    return responses.map((section, idx) => {
      const titleMatch = section.title.toLowerCase().includes(lowerQuery);
      const matchingOptions = section.options.filter(opt =>
        titleMatch ||
        opt.description.toLowerCase().includes(lowerQuery) ||
        (opt.observedDescription || '').toLowerCase().includes(lowerQuery) ||
        (opt.feedbackText || '').toLowerCase().includes(lowerQuery)
      );
      return matchingOptions.length > 0 ? { ...section, originalIdx: idx, options: matchingOptions } : null;
    }).filter(Boolean);
  }, [responses, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const lowerQuery = searchQuery.toLowerCase();
    const indicesToOpen = responses.reduce((acc, section, idx) => {
      const hasMatch =
        section.title.toLowerCase().includes(lowerQuery) ||
        section.options.some(o =>
          o.description.toLowerCase().includes(lowerQuery) ||
          (o.observedDescription || '').toLowerCase().includes(lowerQuery) ||
          (o.feedbackText || '').toLowerCase().includes(lowerQuery)
        );
      if (hasMatch) acc.push(String(idx));
      return acc;
    }, []);
    if (indicesToOpen.length > 0) setOpenSections(prev => Array.from(new Set([...prev, ...indicesToOpen])));
  }, [searchQuery, responses]);

  return { searchQuery, setSearchQuery, openSections, toggleSection, filteredData };
};
