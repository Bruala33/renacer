plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.beatstar.renacer"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.beatstar.renacer"
        minSdk = 24
        targetSdk = 35
        versionCode = 38
        versionName = "3.8.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("debugConfig") {
            storeFile = file("${rootDir}/debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debugConfig")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debugConfig")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.webkit:webkit:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
}

tasks.matching { it.name == "assembleDebug" || it.name == "assembleRelease" }.configureEach {
    doLast {
        val releaseApk = file("${project.buildDir}/outputs/apk/release/app-release.apk")
        val debugApk = file("${project.buildDir}/outputs/apk/debug/app-debug.apk")
        val builtApk = if (releaseApk.exists() && releaseApk.length() > 100000L && releaseApk.lastModified() >= debugApk.lastModified()) {
            releaseApk
        } else {
            debugApk
        }
        if (builtApk.exists() && builtApk.length() > 100000L) {
            val targets = listOf(
                file("${rootDir}/PianoCommunity.apk"),
                file("${rootDir}/app/static/PianoCommunity.apk"),
                file("${rootDir}/app/static/downloads/PianoCommunity.apk")
            )
            for (dst in targets) {
                try {
                    dst.parentFile?.mkdirs()
                    builtApk.copyTo(dst, overwrite = true)
                } catch (_: Exception) {}
            }
        }
    }
}

