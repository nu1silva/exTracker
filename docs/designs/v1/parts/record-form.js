class RecordForm extends DCLogic {
  state = { kind: 'Expense', amount: null, cat: undefined, split: null, a: null, b: null, received: '', date: '2026-11-25', desc: null };

  renderVals() {
    const s = this.state;
    const theme = this.props.theme === 'dark' ? 'dark' : 'light';
    const ex = this.props.example ?? true;
    const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
    const money = (n) => (n < 0 ? '−' : '') + '€' + Math.abs(n).toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const amount = s.amount ?? (ex ? '61.00' : '');
    const cat = s.cat === undefined ? (ex ? 'Groceries' : null) : s.cat;
    const split = s.split ?? ex;
    const a = s.a ?? (ex ? '45.25' : '');
    const b = s.b ?? (ex ? '15.75' : '');
    const desc = s.desc ?? (ex ? 'Albert Heijn' : '');
    const kind = s.kind;
    const isTransfer = kind === 'Transfer';
    const canSplit = kind === 'Expense' || kind === 'Refund';

    const sets = {
      Expense: [['Groceries', 'food'], ['Restaurants', 'food'], ['Public transport', 'transport'], ['Home', 'shopping'], ['Going out', 'leisure']],
      Refund: [['Groceries', 'food'], ['Online orders', 'shopping'], ['Clothing', 'shopping'], ['Home', 'shopping'], ['Public transport', 'transport']],
      Income: [['Salary', 'in'], ['Other income', 'in']],
      Transfer: []
    };
    const color = (id) => id === 'in' ? 'var(--in)' : 'var(--cat-' + id + ')';
    const picks = sets[kind].map(([name, id]) => ({ name, color: color(id), on: cat === name, pick: () => this.setState({ cat: name }) }));

    const remainN = Math.round((num(amount) - num(a) - num(b)) * 100) / 100;
    const blocked = !(num(amount) > 0) || (isTransfer ? !(num(s.received) > 0) : (canSplit && split ? remainN !== 0 : !cat));
    const rate = num(s.received) > 0 && num(amount) > 0 ? num(s.received) / num(amount) : 0;

    return {
      cls: theme === 'light' ? 'ex ex-light' : 'ex',
      kinds: ['Expense', 'Income', 'Transfer', 'Refund'].map((name) => ({ name, on: kind === name, pick: () => this.setState({ kind: name, cat: null }) })),
      amountLabel: isTransfer ? 'Amount sent' : 'Amount',
      amount, setAmount: (e) => this.setState({ amount: e.target.value }),
      isTransfer, notTransfer: !isTransfer, canSplit,
      received: s.received, setReceived: (e) => this.setState({ received: e.target.value }),
      rateNote: rate ? 'Your rate: 1 EUR = ' + rate.toFixed(4) + ' USD. ECB on 24 Nov: 1.0800.' : 'ECB rate on 24 Nov: 1 EUR = 1.0800 USD. Enter what actually arrived.',
      picks,
      split: canSplit && split,
      splitLabel: split ? 'Remove split' : 'Split across categories',
      toggleSplit: () => this.setState({ split: !split }),
      lines: [
        { name: 'Groceries', color: color('food'), value: a, set: (e) => this.setState({ a: e.target.value }) },
        { name: 'Home', color: color('shopping'), value: b, set: (e) => this.setState({ b: e.target.value }) }
      ],
      remain: money(remainN),
      remainTone: remainN === 0 ? 'var(--ok-text)' : 'var(--over-text)',
      date: s.date, setDate: (e) => this.setState({ date: e.target.value }),
      desc, setDesc: (e) => this.setState({ desc: e.target.value }),
      blocked,
      saveLabel: 'Save ' + kind.toLowerCase(),
      close: () => { if (typeof this.props.onClose === 'function') this.props.onClose(); }
    };
  }
}

Prototype.part('RecordForm', RecordForm, `
<div class="{{ cls }}" style="display: flex; flex-direction: column; gap: 22px; min-height: 100%; padding: 24px; background: var(--surface)">
  <div style="display: flex; align-items: center; justify-content: space-between">
    <h2 style="margin: 0; font-size: 22px; font-weight: 700; font-stretch: 110%">Add record</h2>
    <button type="button" class="icon-btn" aria-label="Close" onClick="{{ close }}" style="margin-right: -10px"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"></path></svg></button>
  </div>

  <div class="seg" role="group" aria-label="Kind of record" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr))">
    <sc-for list="{{ kinds }}" as="k">
      <button type="button" aria-pressed="{{ k.on }}" onClick="{{ k.pick }}" style="padding: 0 4px">{{ k.name }}</button>
    </sc-for>
  </div>

  <label style="display: flex; flex-direction: column; gap: 4px; padding: 14px 18px; border-radius: 14px; background: var(--ground)">
    <span class="t3">{{ amountLabel }}</span>
    <span style="display: flex; align-items: baseline; gap: 6px">
      <span class="figure" style="font-size: 40px; color: var(--text-3)">€</span>
      <input inputmode="decimal" placeholder="0.00" value="{{ amount }}" onChange="{{ setAmount }}" class="figure" style="flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; font-size: 48px; font-weight: 700; outline-offset: 6px">
    </span>
  </label>

  <sc-if value="{{ isTransfer }}">
    <div style="display: flex; flex-direction: column; gap: 16px">
      <label class="label">From
        <select class="field"><option>ING Checking, €3,486.15</option><option>bunq Savings, €4,200.00</option><option>bunq Travel, €610.00</option><option>Revolut EUR, €164.30</option><option>Cash, €95.00</option></select>
      </label>
      <label class="label">To
        <select class="field"><option>Wise USD, $842.40</option><option>bunq Savings, €4,200.00</option><option>bunq Travel, €610.00</option><option>Revolut EUR, €164.30</option><option>Cash, €95.00</option></select>
      </label>
      <label class="label">Amount received in USD
        <input class="field tnum" inputmode="decimal" placeholder="0.00" value="{{ received }}" onChange="{{ setReceived }}">
      </label>
      <p class="t3" aria-live="polite" style="margin: 0">{{ rateNote }}</p>
    </div>
  </sc-if>

  <sc-if value="{{ notTransfer }}">
    <div style="display: flex; flex-direction: column; gap: 22px">
      <fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 10px; min-width: 0">
        <legend style="padding: 0 0 8px; font-size: 13px; font-weight: 550; color: var(--text-2)">Category</legend>
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <sc-for list="{{ picks }}" as="p">
            <button type="button" class="chip" aria-pressed="{{ p.on }}" onClick="{{ p.pick }}"><span class="swatch" style="background: {{ p.color }}"></span>{{ p.name }}</button>
          </sc-for>
          <button type="button" class="chip">All categories</button>
        </div>
      </fieldset>

      <sc-if value="{{ canSplit }}">
        <div style="display: flex; flex-direction: column; gap: 10px">
          <button type="button" class="btn" aria-expanded="{{ split }}" onClick="{{ toggleSplit }}" style="align-self: flex-start">{{ splitLabel }}</button>
          <sc-if value="{{ split }}">
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: 14px; background: var(--ground)">
              <sc-for list="{{ lines }}" as="l">
                <label style="display: grid; grid-template-columns: 10px minmax(0, 1fr) 120px; gap: 12px; align-items: center">
                  <span class="swatch" style="background: {{ l.color }}"></span>
                  <span>{{ l.name }}</span>
                  <input class="field tnum right" inputmode="decimal" placeholder="0.00" value="{{ l.value }}" onChange="{{ l.set }}">
                </label>
              </sc-for>
              <div class="tnum" aria-live="polite" style="display: flex; justify-content: space-between; padding: 6px 12px 0 22px; font-weight: 600; color: {{ remainTone }}"><span>Left to assign</span><span>{{ remain }}</span></div>
            </div>
          </sc-if>
        </div>
      </sc-if>

      <label class="label">Account
        <select class="field"><option>ING Checking, €3,486.15</option><option>Revolut EUR, €164.30</option><option>Cash, €95.00</option><option>Wise USD, $842.40</option></select>
      </label>
    </div>
  </sc-if>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); gap: 16px">
    <label class="label">Date
      <input type="date" class="field" value="{{ date }}" onChange="{{ setDate }}">
    </label>
    <label class="label">Description
      <input class="field" placeholder="Optional" value="{{ desc }}" onChange="{{ setDesc }}">
    </label>
  </div>

  <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 8px">
    <button type="button" class="btn" onClick="{{ close }}">Cancel</button>
    <button type="button" class="btn btn-primary" disabled="{{ blocked }}" onClick="{{ close }}" style="flex: 1; min-height: 52px; font-size: 16px">{{ saveLabel }}</button>
  </div>
</div>
`);
