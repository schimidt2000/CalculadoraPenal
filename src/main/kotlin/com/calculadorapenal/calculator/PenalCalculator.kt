package com.calculadorapenal.calculator

import com.calculadorapenal.models.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

object PenalCalculator {

    private val inputFormatter: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val outputFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    fun calculate(req: CalculationRequest): CalculationResult {
        require(req.nomeCompleto.isNotBlank()) { "Nome completo é obrigatório." }
        require(req.whatsapp.isNotBlank()) { "WhatsApp é obrigatório." }
        require(req.dataInicio.isNotBlank()) { "Data de início é obrigatória." }

        val dataBase = LocalDate.parse(req.dataInicio, inputFormatter)

        // Calcula o fim da pena total a partir da data base
        val penaFimDate = dataBase
            .plusYears(req.penaAnos.toLong())
            .plusMonths(req.penaMeses.toLong())
            .plusDays(req.penaDias.toLong())

        // Calcula a detração como duração de dias (usando a mesma data base como âncora)
        val detracaoFimDate = dataBase
            .plusYears(req.detracaoAnos.toLong())
            .plusMonths(req.detracaoMeses.toLong())
            .plusDays(req.detracaoDias.toLong())

        val penaTotalDias = ChronoUnit.DAYS.between(dataBase, penaFimDate)
        val detracaoDias = ChronoUnit.DAYS.between(dataBase, detracaoFimDate)
        val penaLiquidaDias = penaTotalDias - detracaoDias

        require(penaLiquidaDias > 0) {
            "A pena líquida (após detração) deve ser maior que zero."
        }

        val penaLiquidaEndDate = dataBase.plusDays(penaLiquidaDias)

        val fracaoProgressao = getFracaoProgressao(req.tipoCrime, req.statusApenado)
        val fracaoLC = getFracaoLC(req.tipoCrime, req.statusApenado)

        // Progressão ao Regime Semiaberto: Data Base + (Pena Líquida × fração)
        val diasSemiaberto = (penaLiquidaDias * fracaoProgressao).toLong()
        val dataSemiaberto = dataBase.plusDays(diasSemiaberto)

        // Progressão ao Regime Aberto: Data Base + (Pena Líquida × fração × 2)
        val diasAberto = (penaLiquidaDias * fracaoProgressao * 2.0).toLong()
        val alertaAbertoNaFimDaPena = diasAberto >= penaLiquidaDias
        val dataAberto = if (alertaAbertoNaFimDaPena) penaLiquidaEndDate else dataBase.plusDays(diasAberto)

        // Livramento Condicional
        val dataLC = fracaoLC?.let { frac ->
            val diasLC = (penaLiquidaDias * frac).toLong()
            dataBase.plusDays(diasLC).format(outputFormatter)
        }

        return CalculationResult(
            nomeCompleto = req.nomeCompleto,
            penaLiquida = PenaLiquidaInfo(
                totalDias = penaLiquidaDias,
                descricao = formatDias(penaLiquidaDias)
            ),
            dataBase = dataBase.format(outputFormatter),
            dataSemiaberto = dataSemiaberto.format(outputFormatter),
            dataAberto = dataAberto.format(outputFormatter),
            dataLivramentoCondicional = dataLC,
            livramentoVedado = fracaoLC == null,
            fracaoProgressao = "${(fracaoProgressao * 100).toInt()}%",
            fracaoLC = fracaoLC?.let { formatFracaoLC(it) },
            alertaAbertoNaFimDaPena = alertaAbertoNaFimDaPena
        )
    }

    // Lei 13.964/19 — Pacote Anticrime (Art. 112 LEP)
    private fun getFracaoProgressao(tipo: TipoCrime, status: StatusApenado): Double = when (tipo) {
        TipoCrime.COMUM          -> if (status == StatusApenado.PRIMARIO) 0.16 else 0.20
        TipoCrime.COMUM_VIOLENCIA -> if (status == StatusApenado.PRIMARIO) 0.25 else 0.30
        TipoCrime.HEDIONDO       -> if (status == StatusApenado.PRIMARIO) 0.40 else 0.60
        TipoCrime.HEDIONDO_MORTE -> if (status == StatusApenado.PRIMARIO) 0.50 else 0.70
    }

    // Art. 83 do Código Penal
    private fun getFracaoLC(tipo: TipoCrime, status: StatusApenado): Double? = when (tipo) {
        TipoCrime.HEDIONDO_MORTE -> null                    // Vedado por lei
        TipoCrime.HEDIONDO       -> 2.0 / 3.0              // 66,67% independente do status
        else -> if (status == StatusApenado.PRIMARIO) 1.0 / 3.0 else 1.0 / 2.0
    }

    private fun formatDias(dias: Long): String {
        if (dias <= 0L) return "0 dias"
        val anos = dias / 365L
        val resto = dias % 365L
        val meses = resto / 30L
        val diasR = resto % 30L
        return buildList {
            if (anos > 0L) add("$anos ano${if (anos != 1L) "s" else ""}")
            if (meses > 0L) add("$meses ${if (meses != 1L) "meses" else "mês"}")
            if (diasR > 0L) add("$diasR dia${if (diasR != 1L) "s" else ""}")
        }.joinToString(", ")
    }

    private fun formatFracaoLC(f: Double): String = when {
        kotlin.math.abs(f - 1.0 / 3.0) < 0.0001 -> "1/3 (33,33%)"
        kotlin.math.abs(f - 1.0 / 2.0) < 0.0001 -> "1/2 (50,00%)"
        kotlin.math.abs(f - 2.0 / 3.0) < 0.0001 -> "2/3 (66,67%)"
        else -> "${(f * 100).toInt()}%"
    }
}
