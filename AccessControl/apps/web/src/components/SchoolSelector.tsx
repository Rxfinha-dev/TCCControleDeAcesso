import { ALL_SCHOOLS_LABEL, useSchoolScope } from '../contexts/SchoolScopeContext';

/** Seletor da escola em uso, exibido só para o super admin. */
export function SchoolSelector() {
  const { selected, schools, select } = useSchoolScope();

  return (
    <div className="school-scope-bar">
      <label htmlFor="school-scope">Escola em uso</label>
      <select
        id="school-scope"
        value={selected === null ? '' : String(selected)}
        onChange={(event) => select(event.target.value === 'all' ? 'all' : Number(event.target.value))}
      >
        {selected === null && <option value="">Nenhuma escola cadastrada</option>}
        <option value="all">{ALL_SCHOOLS_LABEL}</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </select>
    </div>
  );
}
