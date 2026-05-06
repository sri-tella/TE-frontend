import React, { useState } from 'react';
import { useEvaluationStore } from '../../store/evaluationStore';
import { Plus, X, List, ChevronRight } from 'react-bootstrap-icons';
import './ActivityLog.css';

const ActivityLog = () => {
  const { activityLog, addLogEntry, updateLogEntry, removeLogEntry } = useEvaluationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTimeChange = (index, value) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length > 2) {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
    }
    updateLogEntry(index, 'time', formatted.slice(0, 5));
  };

  const togglePeriod = (index) => {
    const current = activityLog[index].period;
    updateLogEntry(index, 'period', current === 'AM' ? 'PM' : 'AM');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLogEntry();
    }
  };

  if (isCollapsed) {
    return (
      <div
        className="activity-log-sticky collapsed"
        onClick={() => setIsCollapsed(false)}
        title="Open Activity Log"
      >
        <List size={18} />
      </div>
    );
  }

  return (
    <div className="activity-log-sticky">
      <div className="log-header">
        <div className="log-header-left">
          <h6>Activity Log</h6>
          <span className="log-count-badge">{activityLog.length}</span>
        </div>
        <button className="log-collapse-btn" onClick={() => setIsCollapsed(true)} title="Collapse">
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="log-content">
        <div className="log-entries">
          {activityLog.map((entry, index) => (
            <div key={index} className="log-entry">
              <div className="time-group">
                <input
                  type="text"
                  className="log-input time-input"
                  placeholder="HH:MM"
                  value={entry.time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className={`period-toggle ${entry.period === 'AM' ? 'active' : ''}`}
                  onClick={() => togglePeriod(index)}
                >
                  {entry.period}
                </button>
              </div>

              <input
                type="text"
                className="log-input activity-input"
                placeholder="Activity..."
                value={entry.activity}
                onChange={(e) => updateLogEntry(index, 'activity', e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {activityLog.length > 1 && (
                <button className="remove-log-btn" onClick={() => removeLogEntry(index)} title="Remove">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="add-log-btn" onClick={addLogEntry}>
          <Plus size={14} /> Add Event
        </button>
      </div>
    </div>
  );
};

export default ActivityLog;
