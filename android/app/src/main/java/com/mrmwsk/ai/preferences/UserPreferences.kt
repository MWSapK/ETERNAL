package com.mrmwsk.ai.preferences

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "user_settings")

class UserPreferences(private val context: Context) {
    val performanceProfile: Flow<String> = context.settingsDataStore.data.map { preferences ->
        preferences[PROFILE_KEY] ?: "adaptive"
    }

    suspend fun setPerformanceProfile(profile: String) {
        require(profile in ALLOWED_PROFILES) { "Unsupported performance profile" }
        context.settingsDataStore.edit { preferences -> preferences[PROFILE_KEY] = profile }
    }

    private companion object {
        val PROFILE_KEY = stringPreferencesKey("performance_profile")
        val ALLOWED_PROFILES = setOf("adaptive", "lite", "power", "custom")
    }
}
