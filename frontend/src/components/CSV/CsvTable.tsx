// Componente de tabela reutilizavel para exibir dados CSV

interface CsvTableProps {
  headers: string[];
  rows: string[][];
  loading: boolean;
  error: string | null;
}

export function CsvTable({ headers, rows, loading, error }: CsvTableProps) {
  if (loading) {
    return <div className="csv-loading">Carregando dados...</div>;
  }

  if (error) {
    return <div className="csv-error">{error}</div>;
  }

  if (rows.length === 0) {
    return <div className="csv-empty">Nenhum dado disponível</div>;
  }

  return (
    <div className="csv-table-wrapper">
      <table className="csv-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
