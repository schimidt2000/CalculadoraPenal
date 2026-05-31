package com.calculadorapenal.plugins

import com.calculadorapenal.calculator.PenalCalculator
import com.calculadorapenal.models.CalculationRequest
import com.calculadorapenal.models.ErrorResponse
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File

fun Application.configureRouting() {
    routing {

        // ── API ─────────────────────────────────────────────────────────────
        post("/api/calcular") {
            try {
                val request = call.receive<CalculationRequest>()
                val result = PenalCalculator.calculate(request)
                call.respond(HttpStatusCode.OK, result)
            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse(e.message ?: "Dados inválidos."))
            } catch (e: Exception) {
                application.log.error("Erro no cálculo", e)
                call.respond(
                    HttpStatusCode.InternalServerError,
                    ErrorResponse("Erro interno ao processar o cálculo.")
                )
            }
        }

        // ── Imagens externas (diretório imagens-logos) ──────────────────────
        staticFiles("/imagens", File("imagens-logos"))

        // ── Frontend (HTML/CSS/JS em src/main/resources/static) ─────────────
        static("/") {
            resources("static")
            defaultResource("static/index.html")
        }
    }
}
