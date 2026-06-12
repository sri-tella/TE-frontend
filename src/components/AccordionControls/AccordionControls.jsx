import './AccordionControls.css';

const AccordionControls = ({ onExpandAll, onCollapseAll, allExpanded, allCollapsed }) => (
  <div className="accordion-controls">
    <button
      type="button"
      className={`acc-ctrl-btn${allExpanded ? ' acc-ctrl-btn--active' : ''}`}
      onClick={onExpandAll}
      disabled={allExpanded}
    >
      Expand All
    </button>
    <span className="acc-ctrl-divider" />
    <button
      type="button"
      className={`acc-ctrl-btn${allCollapsed ? ' acc-ctrl-btn--active' : ''}`}
      onClick={onCollapseAll}
      disabled={allCollapsed}
    >
      Collapse All
    </button>
  </div>
);

export default AccordionControls;
