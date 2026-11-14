package com.mrmwsk.ai.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mrmwsk.ai.device.DeviceProfileReader

private enum class AppDestination(val title: String) {
    HOME("Home"), CHAT("Chat"), TOOLS("Tools"), LIBRARY("Library"), MODELS("Models"), SETTINGS("Settings")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MrMwsksApp() {
    var destination by remember { mutableStateOf(AppDestination.HOME) }
    val context = LocalContext.current
    val device = remember(context) { DeviceProfileReader.read(context) }

    Scaffold(
        topBar = { TopAppBar(title = { Text("MrMWSK’s AI") }) },
        bottomBar = {
            NavigationBar {
                AppDestination.entries.forEach { item ->
                    NavigationBarItem(
                        selected = destination == item,
                        onClick = { destination = item },
                        icon = { Text(item.title.take(1), style = MaterialTheme.typography.labelLarge) },
                        label = { Text(item.title) },
                    )
                }
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            when (destination) {
                AppDestination.HOME -> HomeScreen(
                    api = device.apiLevel,
                    abis = device.supportedAbis,
                    availableRam = device.availableMemoryBytes,
                    storage = device.availableInternalStorageBytes,
                )
                AppDestination.CHAT -> StatusScreen(
                    "Chat",
                    "Local inference is not implemented yet. No simulated answers are shown. Milestone 2 will integrate a native runtime and a separately downloaded model.",
                )
                AppDestination.TOOLS -> StatusScreen("Tools", "Tools are not implemented yet.")
                AppDestination.LIBRARY -> StatusScreen("Library", "Document import and local indexing are not implemented yet.")
                AppDestination.MODELS -> StatusScreen("Models", "No model is installed. A verified model catalog, downloads, and inference runtime are not implemented yet.")
                AppDestination.SETTINGS -> StatusScreen("Settings", "Offline-only is the current default. Provider consent and configurable performance controls are not implemented yet.")
            }
        }
    }
}

@Composable
private fun HomeScreen(api: Int, abis: List<String>, availableRam: Long?, storage: Long?) {
    Text("Offline-first Android assistant", style = MaterialTheme.typography.headlineSmall)
    InfoCard("AI status", "Offline only · No local model installed")
    InfoCard("Performance", "Adaptive · device facts are best-effort")
    InfoCard("Android", "API $api · ABI ${abis.joinToString().ifBlank { "unknown" }}")
    InfoCard("Available memory", availableRam?.let(::formatBytes) ?: "Unknown")
    InfoCard("Available internal storage", storage?.let(::formatBytes) ?: "Unknown")
    Text("Model downloads and AI inference are not enabled in this milestone.", style = MaterialTheme.typography.bodyMedium)
}

@Composable
private fun StatusScreen(title: String, message: String) {
    Text(title, style = MaterialTheme.typography.headlineSmall)
    InfoCard("Status", message)
}

@Composable
private fun InfoCard(title: String, message: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

private fun formatBytes(bytes: Long): String {
    val gib = bytes.toDouble() / (1024.0 * 1024.0 * 1024.0)
    return "%.1f GiB".format(gib)
}
