using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
        bool menuExpamd = false;

        private void lbl_Click(object sender, EventArgs e)
        {

        }
    }
}
