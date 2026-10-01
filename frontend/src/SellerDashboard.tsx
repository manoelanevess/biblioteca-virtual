import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  Eye,
  LoaderCircle,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'

import { ApiError } from './api/autenticacao'
import {
  getSellerDashboard,
  type DashboardPeriod,
  type SellerDashboardData,
} from './api/dashboard'
import './SellerDashboard.css'

export function SellerDashboard({ token }: { token: string }) {
  const [period, setPeriod] = useState<DashboardPeriod>(6)
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadVersion, setReloadVersion] = useState(0)

  useEffect(() => {
    let active = true

    getSellerDashboard(token, period)
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Não foi possível carregar o dashboard.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [period, reloadVersion, token])

  return (
    <section className="seller-dashboard workspace-content">
      <header className="dashboard-heading">
        <div>
          <p className="section-label">Área restrita</p>
          <h1>Visão geral</h1>
          <p>Acompanhe o desempenho do catálogo e das vendas.</p>
        </div>
        <div className="dashboard-period" aria-label="Período dos gráficos">
          {([6, 12] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={period === value ? 'active' : undefined}
              aria-pressed={period === value}
              onClick={() => {
                setLoading(true)
                setError(null)
                setPeriod(value)
              }}
              disabled={loading}
            >
              {value} meses
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="dashboard-feedback" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setError(null)
              setReloadVersion((version) => version + 1)
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="dashboard-loading" aria-label="Carregando dashboard">
          <LoaderCircle size={27} aria-hidden="true" />
          <span>Calculando indicadores</span>
        </div>
      ) : dashboard ? (
        <DashboardContent dashboard={dashboard} updating={loading} />
      ) : null}
    </section>
  )
}

function DashboardContent({
  dashboard,
  updating,
}: {
  dashboard: SellerDashboardData
  updating: boolean
}) {
  const { resumo } = dashboard

  return (
    <div className={`dashboard-content${updating ? ' updating' : ''}`}>
      <div className="dashboard-metrics" aria-label="Indicadores gerais">
        <Metric
          label="Faturamento"
          value={formatCurrency(resumo.faturamento)}
          detail={`Ticket médio ${formatCurrency(resumo.ticketMedio)}`}
          icon={<Banknote size={20} />}
          tone="green"
        />
        <Metric
          label="Pedidos"
          value={formatNumber(resumo.pedidos)}
          detail={`${formatNumber(resumo.unidadesVendidas)} unidades vendidas`}
          icon={<ReceiptText size={20} />}
          tone="coral"
        />
        <Metric
          label="Visualizações"
          value={formatNumber(resumo.visualizacoes)}
          detail={`${formatNumber(resumo.taxaConversao)}% de conversão`}
          icon={<Eye size={20} />}
          tone="blue"
        />
        <Metric
          label="Ofertas ativas"
          value={formatNumber(resumo.ofertasAtivas)}
          detail="Publicadas no catálogo"
          icon={<PackageCheck size={20} />}
          tone="yellow"
        />
        <Metric
          label="Livros vendidos"
          value={formatNumber(resumo.unidadesVendidas)}
          detail="Físicos e digitais"
          icon={<BookOpenCheck size={20} />}
          tone="green"
        />
        <Metric
          label="Estoque baixo"
          value={formatNumber(resumo.estoqueBaixo)}
          detail="Ofertas com até 5 unidades"
          icon={<AlertTriangle size={20} />}
          tone={resumo.estoqueBaixo ? 'coral' : 'green'}
        />
      </div>

      <div className="dashboard-primary-grid">
        <MonthlySalesChart data={dashboard.vendasMensais} />
        <FormatChart data={dashboard.vendasPorFormato} />
      </div>

      <div className="dashboard-secondary-grid">
        <TopBooks books={dashboard.livrosMaisVendidos} />
        <StockAlerts alerts={dashboard.alertasEstoque} />
      </div>

      <RecentOrders orders={dashboard.pedidosRecentes} />
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string
  value: string
  detail: string
  icon: ReactNode
  tone: 'green' | 'coral' | 'blue' | 'yellow'
}) {
  return (
    <article className="dashboard-metric">
      <span className={`dashboard-metric-icon ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function MonthlySalesChart({
  data,
}: {
  data: SellerDashboardData['vendasMensais']
}) {
  const maximum = Math.max(...data.map(({ faturamento }) => faturamento), 1)

  return (
    <section className="dashboard-panel sales-chart-panel">
      <PanelHeading
        title="Evolução das vendas"
        subtitle="Faturamento mensal"
        icon={<TrendingUp size={18} />}
      />
      <div
        className="monthly-chart"
        role="img"
        aria-label={data
          .map(
            ({ mes, faturamento, pedidos }) =>
              `${formatMonth(mes)}: ${formatCurrency(faturamento)}, ${pedidos} pedidos`,
          )
          .join('; ')}
      >
        {data.map((item) => {
          const height = item.faturamento
            ? Math.max(7, (item.faturamento / maximum) * 100)
            : 2

          return (
            <div className="month-column" key={item.mes}>
              <span className="month-total">{shortCurrency(item.faturamento)}</span>
              <div className="month-bar-track" title={formatCurrency(item.faturamento)}>
                <span style={{ height: `${height}%` }} />
              </div>
              <strong>{formatMonth(item.mes)}</strong>
              <small>{item.pedidos} ped.</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FormatChart({ data }: { data: SellerDashboardData['vendasPorFormato'] }) {
  const totalUnits = data.reduce((total, item) => total + item.unidades, 0)

  return (
    <section className="dashboard-panel format-chart-panel">
      <PanelHeading
        title="Vendas por formato"
        subtitle="Participação em unidades"
        icon={<ShoppingBag size={18} />}
      />
      <div className="format-chart">
        {data.map((item) => {
          const percentage = totalUnits
            ? Math.round((item.unidades / totalUnits) * 100)
            : 0
          const label = item.formato === 'FISICO' ? 'Livro físico' : 'E-book'

          return (
            <div className="format-chart-row" key={item.formato}>
              <div>
                <strong>{label}</strong>
                <span>{formatCurrency(item.faturamento)}</span>
              </div>
              <div className="format-chart-track" aria-hidden="true">
                <span
                  className={item.formato.toLowerCase()}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <footer>
                <span>{formatNumber(item.unidades)} unidades</span>
                <strong>{percentage}%</strong>
              </footer>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TopBooks({ books }: { books: SellerDashboardData['livrosMaisVendidos'] }) {
  const maximum = Math.max(...books.map(({ unidades }) => unidades), 1)

  return (
    <section className="dashboard-panel top-books-panel">
      <PanelHeading
        title="Livros com melhor desempenho"
        subtitle="Ranking por unidades vendidas"
        icon={<BookOpenCheck size={18} />}
      />
      {books.length ? (
        <ol className="top-books-list">
          {books.map((book, index) => (
            <li key={book.id}>
              <span className="ranking-position">{index + 1}</span>
              <div className="ranking-book">
                <div>
                  <strong>{book.titulo}</strong>
                  <span>{book.formatos.map(formatBookFormat).join(' + ')}</span>
                </div>
                <div className="ranking-track" aria-hidden="true">
                  <span style={{ width: `${(book.unidades / maximum) * 100}%` }} />
                </div>
              </div>
              <div className="ranking-result">
                <strong>{book.unidades}</strong>
                <span>{book.visualizacoes} visualizações</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <PanelEmpty text="Os livros vendidos aparecerão neste ranking." />
      )}
    </section>
  )
}

function StockAlerts({
  alerts,
}: {
  alerts: SellerDashboardData['alertasEstoque']
}) {
  return (
    <section className="dashboard-panel stock-alert-panel">
      <PanelHeading
        title="Atenção ao estoque"
        subtitle="Ofertas físicas com até 5 unidades"
        icon={<AlertTriangle size={18} />}
      />
      {alerts.length ? (
        <ul className="stock-alert-list">
          {alerts.map((alert) => (
            <li key={alert.ofertaId}>
              <span aria-hidden="true"><AlertTriangle size={16} /></span>
              <div>
                <strong>{alert.titulo}</strong>
                <small>Reposição recomendada</small>
              </div>
              <strong className={alert.estoque === 0 ? 'empty' : undefined}>
                {alert.estoque} un.
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <PanelEmpty text="Nenhuma oferta ativa está com estoque baixo." positive />
      )}
    </section>
  )
}

function RecentOrders({
  orders,
}: {
  orders: SellerDashboardData['pedidosRecentes']
}) {
  return (
    <section className="dashboard-panel recent-orders-panel">
      <PanelHeading
        title="Pedidos recentes"
        subtitle="Últimas compras confirmadas"
        icon={<ReceiptText size={18} />}
      />
      {orders.length ? (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Data</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td>{order.cliente.nome}</td>
                  <td>{order.quantidadeItens}</td>
                  <td>{formatDate(order.criadoEm)}</td>
                  <td><span className="order-status">{formatOrderStatus(order.status)}</span></td>
                  <td>{formatCurrency(order.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PanelEmpty text="Os pedidos confirmados aparecerão aqui." />
      )}
    </section>
  )
}

function PanelHeading({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: ReactNode
}) {
  return (
    <header className="dashboard-panel-heading">
      <span aria-hidden="true">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}

function PanelEmpty({ text, positive = false }: { text: string; positive?: boolean }) {
  return (
    <div className={`dashboard-panel-empty${positive ? ' positive' : ''}`}>
      {positive ? <PackageCheck size={24} /> : <TrendingUp size={24} />}
      <p>{text}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function shortCurrency(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  }
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function formatMonth(value: string) {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function formatBookFormat(format: 'FISICO' | 'EBOOK') {
  return format === 'FISICO' ? 'Físico' : 'E-book'
}

function formatOrderStatus(status: 'PAGO' | 'ENVIADO' | 'CONCLUIDO') {
  const labels = {
    PAGO: 'Pago',
    ENVIADO: 'Enviado',
    CONCLUIDO: 'Concluído',
  }
  return labels[status]
}
