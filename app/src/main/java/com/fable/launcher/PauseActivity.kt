package com.fable.launcher

import android.app.Activity
import android.os.Bundle
import android.os.CountDownTimer
import android.widget.Button
import android.widget.TextView

/**
 * The mindful pause: shown before a "distracting" app opens.
 * The user can walk away straight away, or wait out the countdown to continue.
 */
class PauseActivity : Activity() {

    private var timer: CountDownTimer? = null
    private var decided = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pause)

        val label = intent.getStringExtra(EXTRA_LABEL) ?: "this app"
        val pkg = intent.getStringExtra(EXTRA_PACKAGE)
        val cls = intent.getStringExtra(EXTRA_CLASS)
        val attempt = intent.getIntExtra(EXTRA_ATTEMPT, 1)
        if (pkg == null || cls == null) {
            finish()
            return
        }
        val app = AppInfo(label, pkg, cls)

        val countdown = findViewById<TextView>(R.id.countdown)
        val attempts = findViewById<TextView>(R.id.attempts)
        val notNow = findViewById<Button>(R.id.notNow)
        val openAnyway = findViewById<Button>(R.id.openAnyway)

        attempts.text = when (attempt) {
            1 -> "First time opening $label today."
            else -> "You've reached for $label $attempt times today."
        }
        openAnyway.text = "Open $label"

        notNow.setOnClickListener {
            decided = true
            Prefs(this).recordSkip()
            finish()
        }
        openAnyway.setOnClickListener {
            decided = true
            Launcher.openDirect(this, app)
            finish()
        }

        val seconds = Prefs(this).pauseSeconds.coerceAtLeast(1)
        countdown.text = seconds.toString()
        timer = object : CountDownTimer(seconds * 1000L, 250L) {
            override fun onTick(millisUntilFinished: Long) {
                countdown.text = ((millisUntilFinished + 999) / 1000).toString()
            }

            override fun onFinish() {
                countdown.text = "·"
                openAnyway.isEnabled = true
                openAnyway.setTextColor(getColor(R.color.text))
            }
        }.start()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Backing out counts as choosing not to open the app.
        if (!decided) {
            decided = true
            Prefs(this).recordSkip()
        }
        super.onBackPressed()
    }

    override fun onDestroy() {
        timer?.cancel()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_LABEL = "label"
        const val EXTRA_PACKAGE = "package"
        const val EXTRA_CLASS = "class"
        const val EXTRA_ATTEMPT = "attempt"
    }
}
