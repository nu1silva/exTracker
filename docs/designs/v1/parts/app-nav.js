class AppNav extends DCLogic {
  state = { adding: false };

  renderVals() {
    const theme = this.props.theme === 'dark' ? 'dark' : 'light';
    const active = this.props.active ?? 'dashboard';
    const cur = {};
    ['dashboard', 'accounts', 'records', 'budgets', 'analytics', 'settings'].forEach((t) => { cur[t] = t === active ? 'page' : undefined; });
    return {
      theme, cur, no: false,
      cls: theme === 'light' ? 'ex ex-light' : 'ex',
      adding: this.state.adding,
      open: () => this.setState({ adding: true }),
      close: () => this.setState({ adding: false })
    };
  }
}

Prototype.part('AppNav', AppNav, `
<div class="{{ cls }}" style="border-bottom: 1px solid var(--line)">
  <header class="topbar">
    <a href="dashboard.html" aria-label="exTracker, go to Dashboard" style="display: flex; align-items: center; gap: 10px; min-height: 48px">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="8" fill="var(--mark)"></rect><path d="M6 12h4v10H6zM13 12h4V6h-4zM13 12h4v4h-4zM20 12h4v7h-4z" fill="var(--on-mark)"></path><path d="M5 12h20" stroke="var(--on-mark)" stroke-width="1.5"></path></svg>
      <span style="font-size: 18px; font-weight: 700; font-stretch: 110%; letter-spacing: -0.01em">exTracker</span>
    </a>
    <nav class="tabs" aria-label="Main">
      <a class="tab" href="dashboard.html" aria-current="{{ cur.dashboard }}">Dashboard</a>
      <a class="tab" href="accounts.html" aria-current="{{ cur.accounts }}">Accounts</a>
      <a class="tab" href="records.html" aria-current="{{ cur.records }}">Records</a>
      <a class="tab" href="budgets.html" aria-current="{{ cur.budgets }}">Budgets</a>
      <a class="tab" href="analytics.html" aria-current="{{ cur.analytics }}">Analytics</a>
      <a class="tab" href="settings.html" aria-current="{{ cur.settings }}">Settings</a>
    </nav>
    <div style="display: flex; align-items: center; gap: 14px; margin-left: auto">
      <button type="button" class="btn btn-primary" onClick="{{ open }}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11"></path></svg>Add record</button>
      <a href="settings.html" aria-label="Sam de Vries, open settings" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line-2); font-size: 13px; font-weight: 650">SV</a>
    </div>
  </header>
  <sc-if value="{{ adding }}">
    <div style="position: fixed; inset: 0; z-index: 20; display: flex; justify-content: flex-end; background: rgba(6,10,12,0.62)">
      <div role="dialog" aria-modal="true" aria-label="Add record" style="width: min(480px, 100%); height: 100%; overflow-y: auto; background: var(--surface)">
        <dc-import name="RecordForm" theme="{{ theme }}" example="{{ no }}" on-close="{{ close }}"></dc-import>
      </div>
    </div>
  </sc-if>
</div>
`);
