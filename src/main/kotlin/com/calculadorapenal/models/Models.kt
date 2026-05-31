package com.calculadorapenal.models

import kotlinx.serialization.Serializable

@Serializable
data class CalculationRequest(
    val nomeCompleto: String,
    val whatsapp: String,
    val email: String? = null,
    val numeroProcesso: String? = null,
    val penaAnos: Int = 0,
    val penaMeses: Int = 0,
    val penaDias: Int = 0,
    val dataInicio: String,
    val detracaoAnos: Int = 0,
    val detracaoMeses: Int = 0,
    val detracaoDias: Int = 0,
    val tipoCrime: TipoCrime,
    val statusApenado: StatusApenado
)

@Serializable
enum class TipoCrime {
    COMUM,
    COMUM_VIOLENCIA,
    HEDIONDO,
    HEDIONDO_MORTE
}

@Serializable
enum class StatusApenado {
    PRIMARIO,
    REINCIDENTE
}

@Serializable
data class PenaLiquidaInfo(
    val totalDias: Long,
    val descricao: String
)

@Serializable
data class CalculationResult(
    val nomeCompleto: String,
    val penaLiquida: PenaLiquidaInfo,
    val dataBase: String,
    val dataSemiaberto: String,
    val dataAberto: String,
    val dataLivramentoCondicional: String?,
    val livramentoVedado: Boolean,
    val fracaoProgressao: String,
    val fracaoLC: String?,
    val alertaAbertoNaFimDaPena: Boolean = false
)

@Serializable
data class ErrorResponse(val erro: String)
