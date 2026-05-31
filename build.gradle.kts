val ktorVersion = "2.3.12"
val kotlinVersion = "2.0.21"
val logbackVersion = "1.4.14"

plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    id("io.ktor.plugin") version "2.3.12"
    application
}

group = "com.calculadorapenal"
version = "1.0.0"

application {
    mainClass.set("com.calculadorapenal.ApplicationKt")
}

repositories {
    mavenCentral()
}

ktor {
    fatJar {
        archiveFileName.set("calculadora-penal-all.jar")
    }
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("ch.qos.logback:logback-classic:$logbackVersion")

    testImplementation("io.ktor:ktor-server-tests-jvm:$ktorVersion")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlinVersion")
}
