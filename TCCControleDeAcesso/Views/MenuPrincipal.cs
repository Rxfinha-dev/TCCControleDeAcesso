using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Views
{
    public partial class MenuPrincipal : Form
    {
        public int id_escola;
        public string _CurrentUsername;
        public MenuPrincipal(string currentUsername, int idEscola)
        {
            InitializeComponent();
            label2.Text = currentUsername;
            id_escola = idEscola;
            _CurrentUsername = currentUsername;
        }
        bool menuExpand = false;

        private void lbl_Click(object sender, EventArgs e)
        {

        }

        private void menuTransition_Tick_Tick(object sender, EventArgs e)
        {

        }
        bool sidebarExpand = true;
        private void sidebarTransition_Tick(object sender, EventArgs e)
        {
            if (sidebarExpand)
            {
                sidebar.Width -= 100;
                if (sidebar.Width <= 70)
                {
                    sidebarExpand = false;
                    sidebarTransition.Stop();
                }
            } else
            {
                sidebar.Width += 10;
                if (sidebar.Width >= 251) {
                    sidebarExpand = true;
                    sidebarTransition.Stop();
                }
            }
        }

        private void sidebar_Paint(object sender, PaintEventArgs e)
        {

        }

        private void btnHam_Click(object sender, EventArgs e)
        {
            sidebarTransition.Start();
        }
    } 
}
