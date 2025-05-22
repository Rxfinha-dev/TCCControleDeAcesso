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
   
    public partial class frmMainMenu : Form
    {



        public int id_escola;

        
        public frmMainMenu(string currentUsername, int idEscola)
        {
            InitializeComponent();
            label2.Text = currentUsername;
            id_escola = idEscola;


           
        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            frmLogin check = new frmLogin();         
            check.Show();
            Hide();
        }

        private void button4_Click(object sender, EventArgs e)
        {
            frmListaAlunos check = new frmListaAlunos(id_escola);
            check.Show();
            Hide();
        }

        private void btnCursos_Click(object sender, EventArgs e)
        {
            frmCadastroCurso check = new frmCadastroCurso(id_escola);
            check.Show();
            Hide();
        }
    }
}
