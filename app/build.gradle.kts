plugins {
  alias(libs.plugins.android.application)
}

android {
  namespace = "com.beatstar.renacer"
  compileSdk = 36

  defaultConfig {
    applicationId = "com.beatstar.renacer"
    minSdk = 24
    targetSdk = 35
    versionCode = 52
    versionName = "5.2.0"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  signingConfigs {
    create("debugConfig") {
      val sharedKs = file("${rootDir}/app-signing.keystore")
      val repoKs = file("${rootDir}/debug.keystore")
      storeFile = when {
        sharedKs.exists() -> sharedKs
        repoKs.exists() -> repoKs
        else -> file("${System.getProperty("user.home")}/.android/debug.keystore")
      }
      storePassword = "android"
      keyAlias = "androiddebugkey"
      keyPassword = "android"
    }
    create("release") {
      val envKs = System.getenv("KEYSTORE_PATH")
      if (!envKs.isNullOrBlank() && file(envKs).exists()) {
        storeFile = file(envKs)
        storePassword = System.getenv("STORE_PASSWORD")
        keyAlias = "upload"
        keyPassword = System.getenv("KEY_PASSWORD")
      } else {
        val sharedKs = file("${rootDir}/app-signing.keystore")
        storeFile = if (sharedKs.exists()) sharedKs else file("${System.getProperty("user.home")}/.android/debug.keystore")
        storePassword = "android"
        keyAlias = "androiddebugkey"
        keyPassword = "android"
      }
    }
  }

  buildTypes {
    release {
      isCrunchPngs = false
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      signingConfig = signingConfigs.getByName("release")
    }
    debug {
      signingConfig = signingConfigs.getByName("debugConfig")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }

  androidResources {
    noCompress += listOf("mp3", "ogg", "wav", "m4a")
  }

  dependenciesInfo {
    includeInApk = false
    includeInBundle = true
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.activity:activity-ktx:1.9.3")
  implementation("androidx.webkit:webkit:1.12.0")
}
