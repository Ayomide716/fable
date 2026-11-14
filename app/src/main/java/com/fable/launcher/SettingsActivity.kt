package com.fable.launcher

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Switch
import android.widget.TextView

class SettingsActivity : Activity() {

    private lateinit var prefs: Prefs

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        prefs = Prefs(this)

        findViewById<Button>(R.id.setDefault).setOnClickListener {
            try {
                startActivity(Intent(Settings.ACTION_HOME_SETTINGS))
            } catch (e: Exception) {
                startActivity(Intent(Settings.ACTION_SETTINGS))
            }
        }

        val group = findViewById<RadioGroup>(R.id.pauseGroup)
        for (s in PAUSE_OPTIONS) {
            group.addView(RadioButton(this).apply {
                id = s // seconds double as view ids; all are small positive numbers
                text = "${s}s"
                setTextColor(getColor(R.color.text))
                isChecked = s == prefs.pauseSeconds
            })
        }
        group.setOnCheckedChangeListener { _, checkedId -> prefs.pauseSeconds = checkedId }

        findViewById<Switch>(R.id.autoLaunch).apply {
            isChecked = prefs.autoLaunch
            setOnCheckedChangeListener { _, checked -> prefs.autoLaunch = checked }
        }
        findViewById<Switch>(R.id.showKeyboard).apply {
            isChecked = prefs.showKeyboard
            setOnCheckedChangeListener { _, checked -> prefs.showKeyboard = checked }
        }
    }

    override fun onResume() {
        super.onResume()
        val distracting = prefs.distracting
        val names = AppRepository.loadApps(this)
            .filter { it.key in distracting }
            .map { it.label }
        findViewById<TextView>(R.id.distractingList).text =
            if (names.isEmpty()) "None yet." else names.joinToString("\n")
    }

    companion object {
        private val PAUSE_OPTIONS = listOf(3, 5, 10, 15)
    }
}
