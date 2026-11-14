package com.mrmwsk.ai.device

enum class PerformanceProfile { ADAPTIVE, LITE, POWER, CUSTOM }

data class ResourceDecision(val allowLargeModel: Boolean, val explanation: String)

/** A conservative first pass only; eventual model admission must include runtime metadata and KV-cache needs. */
object ResourcePolicy {
    fun decide(profile: PerformanceProfile, availableRamBytes: Long?): ResourceDecision {
        if (profile == PerformanceProfile.LITE) {
            return ResourceDecision(false, "Lite profile avoids large-model workloads.")
        }
        if (availableRamBytes == null || availableRamBytes <= 0L) {
            return ResourceDecision(false, "Available memory is unknown; using conservative limits.")
        }
        val threshold = 4L * 1024L * 1024L * 1024L
        return if (profile == PerformanceProfile.POWER && availableRamBytes >= threshold) {
            ResourceDecision(true, "Power profile permits considering a larger model; compatibility checks still apply.")
        } else {
            ResourceDecision(false, "Conservative policy selected; model size alone does not determine memory needs.")
        }
    }
}
