export default function SearchBar({ value, onChange, onClear, isLoading = false }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" className="btn btn-secondary" onClick={onClear}>
        Limpiar
      </button>
      {isLoading && <span className="search-status">Buscando...</span>}
    </div>
  )
}
