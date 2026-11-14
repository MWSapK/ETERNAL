package com.mrmwsk.ai.device

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs

/** Best-effort facts; unknown values are null rather than guessed. */
data class DeviceProfile(
    val apiLevel: Int,
    val supportedAbis: List<String>,
    val totalMemoryBytes: Long?,
    val availableMemoryBytes: Long?,
    val memoryClassMb: Int?,
    val availableInternalStorageBytes: Long?,
)

object DeviceProfileReader {
    fun read(context: Context): DeviceProfile {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = runCatching {
            ActivityManager.MemoryInfo().also { info -> activityManager?.getMemoryInfo(info) }
        }.getOrNull()
        val storage = runCatching {
            val stats = StatFs(Environment.getDataDirectory().absolutePath)
            stats.availableBlocksLong * stats.blockSizeLong
        }.getOrNull()

        return DeviceProfile(
            apiLevel = Build.VERSION.SDK_INT,
            supportedAbis = Build.SUPPORTED_ABIS?.toList().orEmpty(),
            totalMemoryBytes = memoryInfo?.totalMem?.takeIf { it > 0L },
            availableMemoryBytes = memoryInfo?.availMem?.takeIf { it > 0L },
            memoryClassMb = runCatching { activityManager?.memoryClass }.getOrNull()?.takeIf { it > 0 },
            availableInternalStorageBytes = storage?.takeIf { it >= 0L },
        )
    }
}
