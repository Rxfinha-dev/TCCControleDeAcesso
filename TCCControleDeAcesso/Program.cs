using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Views;

namespace TCCControleDeAcesso
{

    internal static class Program
    {
        /// <summary>
        /// Ponto de entrada principal para o aplicativo.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Captura erros não tratados da UI
            Application.ThreadException += Application_ThreadException;

            // Captura erros não tratados fora da UI (threads não principais)
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;

            Application.Run(new Views.frmMainMenu("", 0));




        }
        private static void Application_ThreadException(object sender, System.Threading.ThreadExceptionEventArgs e)
        {
            MessageBox.Show("Ocorreu um erro inesperado: " + e.Exception.Message,
                "Erro de aplicação", MessageBoxButtons.OK, MessageBoxIcon.Error);

            // Exemplo de ação: registrar log e continuar
        }

        private static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Exception ex = (Exception)e.ExceptionObject;
            MessageBox.Show("Erro crítico: " + ex.Message,
                "Erro fatal", MessageBoxButtons.OK, MessageBoxIcon.Error);

            // Exemplo de ação: salvar log e encerrar com segurança
            Application.Exit();
        }
    }
}
