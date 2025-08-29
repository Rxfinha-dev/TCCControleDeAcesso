using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;


namespace TCCControleDeAcesso.Views
{
   
    public partial class frmMainMenu : Form
    {

        [DllImport("Gdi32", EntryPoint = "CreateRoundRectRgn")]

        private static extern IntPtr CreateRoundRgn
(
int nLeftRect,
int nTopRect,
int nRightRect,
int nBottomRect,
int nWidthEllipse,
int nHeightEllipse
);

        public int id_escola;

        
        public frmMainMenu(string currentUsername, int idEscola)
        {
            InitializeComponent();
            //Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, Width, Height, 25, 25));
            label2.Text = currentUsername;
            id_escola = idEscola;
        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            frmLogin check = new frmLogin();         
            check.Show();
            Hide();
        }

        private void btnAlunos_Click(object sender, EventArgs e)
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

        private void frmMainMenu_Load(object sender, EventArgs e)
        {

        }

        private void button5_Click(object sender, EventArgs e)
        {
            //panel1.Height = b;
        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {

        }

        private void btnConfiguracoes_Click(object sender, EventArgs e)
        {
            frmConfiguracoes check = new frmConfiguracoes();
            check.Show();
        }

        private void btnVerificacao_Click(object sender, EventArgs e)
        {
            frmVerificacao check = new frmVerificacao();
            check.Show();
        }

        private void button8_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }

        private void btnVerificao_Click(object sender, EventArgs e)
        {
            frmVerificacao check = new frmVerificacao();
            check.Show();
            Hide();
        }

        private void btnCurso_Click(object sender, EventArgs e)
        {
            frmCadastroCurso check = new frmCadastroCurso(id_escola);
            check.Show();
            Hide();
        }

        private void btnAluno_Click(object sender, EventArgs e)
        {
            frmListaAlunos check = new frmListaAlunos(id_escola);
            check.Show();
            Hide();
        }

        private void btnConfig_Click(object sender, EventArgs e)
        {
            frmConfiguracoes check = new frmConfiguracoes();
            check.Show();
        }
    }
}
