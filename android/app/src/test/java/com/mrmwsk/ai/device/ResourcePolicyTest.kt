package com.mrmwsk.ai.device

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ResourcePolicyTest {
    @Test
    fun liteNeverAllowsLargeModel() {
        val decision = ResourcePolicy.decide(PerformanceProfile.LITE, 16L * 1024 * 1024 * 1024)
        assertFalse(decision.allowLargeModel)
    }

    @Test
    fun unknownMemoryIsConservative() {
        assertFalse(ResourcePolicy.decide(PerformanceProfile.ADAPTIVE, null).allowLargeModel)
    }

    @Test
    fun powerNeedsKnownMemoryAboveThreshold() {
        assertFalse(ResourcePolicy.decide(PerformanceProfile.POWER, null).allowLargeModel)
        assertTrue(ResourcePolicy.decide(PerformanceProfile.POWER, 8L * 1024 * 1024 * 1024).allowLargeModel)
    }
}
