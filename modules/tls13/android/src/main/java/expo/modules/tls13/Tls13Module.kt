package expo.modules.tls13

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.Security

class Tls13Module : Module() {
    override fun definition() = ModuleDefinition {
        Name("Tls13")

        // Observability only: the provider patch itself runs in
        // Tls13InitProvider before any application code exists.
        Function("status") {
            Security.getProviders()[0].name
        }
    }
}
