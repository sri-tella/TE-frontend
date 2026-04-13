import React, { useState } from 'react';
import { useEvaluationStore } from '../../store/evaluationStore';
import { Plus, X, List, ChevronRight } from 'react-bootstrap-icons';
import './ActivityLog.css';

const ActivityLog = () => {
  const { activityLog, addLogEntry, updateLogEntry, removeLogEntry } = useEvaluationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTimeChange = (index, value) => {
    // Basic auto-colon formatting for HH:MM
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
      <div className="activity-log-sticky collapsed" onClick={() => setIsCollapsed(false)} title="Open Activity Log">
        <List size={24} />
      </div>
    );
  }

  return (
    <div className="activity-log-sticky shadow">
      <div className="log-header">
        <h6>Activity Log</h6>
        <button className="btn btn-sm text-white border-0" onClick={() => setIsCollapsed(true)}>
          <ChevronRight />
        </button>
      </div>
      <div className="log-content">
        <table className="log-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Time</th>
              <th>Activity</th>
              <th style={{ width: '20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {activityLog.map((entry, index) => (
              <tr key={index} className="log-row">
                <td className="pe-2">
                  <div className="time-input-container">
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
                </td>
                <td>
                  <input
                    type="text"
                    className="log-input activity-input"
                    placeholder="Activity..."
                    value={entry.activity}
                    onChange={(e) => updateLogEntry(index, 'activity', e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </td>
                <td>
                  {activityLog.length > 1 && (
                    <button className="remove-log-btn" onClick={() => removeLogEntry(index)}>
                      <X />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="add-log-btn" onClick={addLogEntry}>
          <Plus /> Add Event
        </button>
      </div>
    </div>
  );
};

export default ActivityLog;
