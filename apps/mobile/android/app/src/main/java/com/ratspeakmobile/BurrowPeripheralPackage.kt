package com.ratspeakmobile

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Registers BurrowPeripheralModule — Android has no autolinking-by-reflection
 *  for arbitrary native modules the way iOS's RCT_EXPORT_MODULE does, so this
 *  explicit ReactPackage is required (see MainApplication.kt). */
class BurrowPeripheralPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(BurrowPeripheralModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
