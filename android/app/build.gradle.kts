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
<<<<<<< HEAD
        versionCode = 47
        versionName = "4.7.0"
=======
        versionCode = 48
        versionName = "4.8.0"
>>>>>>> 84b4f1b6fc4fe5b2638d5cfdc8c38f75cef853e2

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("debugConfig") {
            storeFile = file("${rootDir}/../debug.keystore")
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
