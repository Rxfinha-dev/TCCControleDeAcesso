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

         
            Application.Run(new Views.frmLogin());

        }
    }
}
