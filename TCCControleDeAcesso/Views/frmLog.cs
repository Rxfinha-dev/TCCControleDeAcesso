using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmLog : Form
    {
        Log _log;
        int id_escola;
        public frmLog(int idEscola)
        {
            InitializeComponent();
            id_escola = idEscola;
        }

        void carregarGrid()
        {
            _log = new Log();          
            dgvLog.DataSource = _log.ShowLog(id_escola);
            //dgvLog.Columns["id"].Visible = false;

        }

        private void dgvLog_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void frmLog_Load(object sender, EventArgs e)
        {
            carregarGrid();
        }
    }
}
